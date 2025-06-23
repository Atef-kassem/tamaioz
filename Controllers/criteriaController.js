// Existing imports
const Criteria = require("../models/Criteria");
const path = require("path");
const fs = require("fs");

// New import for CriterionReview model
const CriterionReview = require("../models/CriterionReview");

// Get all criteria in hierarchical structure
exports.getAllCriteria = async (req, res) => {
  try {
    const criteria = await Criteria.find().lean();
    // Build tree structure
    const map = {};
    criteria.forEach((item) => {
      item.children = [];
      map[item._id] = item;
    });
    const roots = [];
    criteria.forEach((item) => {
      if (item.parent) {
        map[item.parent]?.children.push(item);
      } else {
        roots.push(item);
      }
    });
    res.json(roots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// New endpoint: Get criterion reviews by association and award
exports.getCriterionReviews = async (req, res) => {
  try {
    const { associationId, awardId } = req.params;
    const reviews = await CriterionReview.find({
      associationId,
      awardId,
    }).lean();
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// New endpoint: Create or update a criterion review
exports.saveCriterionReview = async (req, res) => {
  try {
    const { associationId, awardId, criterionId } = req.params;
    const { rating, notes } = req.body;

    let review = await CriterionReview.findOne({
      associationId,
      awardId,
      criterionId,
    });
    if (review) {
      review.rating = rating !== undefined ? rating : review.rating;
      review.notes = notes !== undefined ? notes : review.notes;
    } else {
      review = new CriterionReview({
        associationId,
        awardId,
        criterionId,
        rating: rating || 0,
        notes: notes || "",
      });
    }
    await review.save();
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new criteria
exports.createCriteria = async (req, res) => {
  try {
    const { name, type, parent, points, properties } = req.body;
    const newCriteria = new Criteria({
      name,
      type,
      parent: parent || null,
      points: points || 0,
      properties: Array.isArray(properties) ? properties : [],
    });
    await newCriteria.save();
    res.status(201).json(newCriteria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.points !== undefined) {
      updates.points = Number(updates.points);
    }
    if (updates.properties && !Array.isArray(updates.properties)) {
      updates.properties = [];
    }
    const updated = await Criteria.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Criteria not found" });
    }

    // Recalculate and update status of the updated criteria
    await recalcAndUpdateStatus(updated);

    // Recursively update parent statuses
    await updateParentStatus(updated.parent);

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// Helper function to recalculate and update status of a criteria item
async function recalcAndUpdateStatus(criteria) {
  if (!criteria) return;

  const hasMethodology =
    criteria.methodology && criteria.methodology.trim() !== "";
  const hasAttachments =
    criteria.attachments && criteria.attachments.length > 0;

  const newStatus =
    hasMethodology || hasAttachments ? "entered" : "not-entered";

  if (criteria.status !== newStatus) {
    criteria.status = newStatus;
    await criteria.save();
  }
}

// Helper function to recursively update parent status
async function updateParentStatus(criteriaId) {
  if (!criteriaId) return;

  const parent = await Criteria.findById(criteriaId);
  if (!parent) return;

  // Find children of this parent
  const children = await Criteria.find({ parent: parent._id });

  // Determine parent's status based on children statuses
  const anyEntered = children.some((child) => child.status === "entered");

  const newStatus = anyEntered ? "entered" : "not-entered";

  if (parent.status !== newStatus) {
    parent.status = newStatus;
    await parent.save();
    // Recursively update parent's parent
    await updateParentStatus(parent.parent);
  }
}

// Delete criteria
exports.deleteCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Criteria.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Criteria not found" });
    }
    res.json({ message: "Criteria deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.renderCriteriaPage = async (req, res) => {
  try {
    const role = req.user ? req.user.role : null;
    const permissions = req.user ? req.user.permissions || [] : [];

    if (role !== "supervisor") {
      return res.status(403).send("Access denied");
    }

    // Fetch criteria counts
    const criteriaEntered = await Criteria.countDocuments({
      status: "entered",
    });
    const criteriaRemaining = await Criteria.countDocuments({
      status: "not-entered",
    });

    // Hardcoded submission status counts (no data source available)
    const submissionStatusCounts = {
      pending: 3,
      approved: 7,
      rejected: 2,
    };

    // Hardcoded notifications
    const notifications = [
      { id: 1, message: "New submission pending review." },
      { id: 2, message: "Meeting scheduled for supervisors." },
    ];

    // Quick links
    const quickLinks = [
      { name: "Manage Criteria", url: "/criteria" },
      { name: "Review Submissions", url: "/submissions/review" },
    ];

    const statistics = {
      criteriaEntered,
      criteriaRemaining,
      submissionStatusCounts,
    };

    // Render criteriaContent.ejs to HTML with user, permissions and title
    req.app.render(
      "criteriaContent",
      { user: req.user, permissions, title: "إدارة المعايير" },
      (err, html) => {
        if (err) {
          console.error("Error rendering criteriaContent:", err);
          return res.status(500).send("Error rendering criteria content");
        }

        // Render dashboard with criteriaContent as body
        res.render("dashboard", {
          title: "لوحة التحكم",
          role,
          statistics,
          notifications,
          quickLinks,
          body: html,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error rendering criteria page");
  }
};

// Upload attachments with text and update criteria
exports.uploadAttachmentsWithText = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const { attachmentText } = req.body;
    const criteria = await Criteria.findById(id);
    if (!criteria) {
      return res.status(404).json({ message: "Criteria not found" });
    }

    // Save the attachment text in a new field (e.g., methodologyNotes)
    criteria.methodologyNotes = attachmentText || "";

    // Add file paths to attachments array
    req.files.forEach((file) => {
      const relativePath = path.join("/uploads", file.filename);
      criteria.attachments.push(relativePath);
    });

    // Recalculate and update status of the criteria
    await recalcAndUpdateStatus(criteria);

    // Recursively update parent statuses
    await updateParentStatus(criteria.parent);

    await criteria.save();

    res.json({
      message: "Attachments and text uploaded successfully",
      attachments: criteria.attachments,
      methodologyNotes: criteria.methodologyNotes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload attachments
exports.uploadAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const criteria = await Criteria.findById(id);
    if (!criteria) {
      return res.status(404).json({ message: "Criteria not found" });
    }

    // Add file paths to attachments array
    req.files.forEach((file) => {
      const relativePath = path.join("/uploads", file.filename);
      criteria.attachments.push(relativePath);
    });

    // Recalculate and update status of the criteria
    await recalcAndUpdateStatus(criteria);

    // Recursively update parent statuses
    await updateParentStatus(criteria.parent);

    await criteria.save();

    res.json({
      message: "Attachments uploaded successfully",
      attachments: criteria.attachments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
