const path = require("path");
const { Association, Criteria } = require("../models");
const multer = require("multer");
const CriterionReview = require("../models/CriterionReview");
const Award = require("../models/Award");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// const Criteria = require("../models/Criteria");

// Existing renderAddAssociation method unchanged
exports.renderAddAssociation = async (req, res) => {
  try {
    const associations = await Association.find().sort({ createdAt: -1 });
    const awards = await Award.find().sort({ createdAt: -1 });
    const role = req.user ? req.user.role : null;

    let statistics = {};
    let notifications = [];
    let quickLinks = [];

    if (role === "supervisor") {
      // Fetch criteria counts dynamically
      const criteriaEntered = await Criteria.countDocuments({
        status: "entered",
      });
      const criteriaRemaining = await Criteria.countDocuments({
        status: "not-entered",
      });

      statistics = {
        criteriaEntered,
        criteriaRemaining,
        submissionStatusCounts: {
          pending: 3,
          approved: 7,
          rejected: 2,
        },
      };
      notifications = [
        { id: 1, message: "New submission pending review." },
        { id: 2, message: "Meeting scheduled for supervisors." },
      ];
      quickLinks = [
        { name: "Manage Criteria", url: "/criteria" },
        { name: "Review Submissions", url: "/submissions/review" },
      ];
    } else if (role === "reviewer") {
      statistics = {
        criteriaEntered: 7,
        criteriaRemaining: 8,
        submissionStatusCounts: {
          pending: 5,
          approved: 4,
          rejected: 1,
        },
      };
      notifications = [
        { id: 1, message: "New criteria assigned for review." },
        { id: 2, message: "Reminder: Submit your reviews." },
      ];
      quickLinks = [
        { name: "View Criteria", url: "/criteria" },
        { name: "Submit Reviews", url: "/reviews/submit" },
        { name: "مراجعة الجمعيات", url: "/associations" },
      ];
    }

    res.render(
      "addAssociation",
      { title: "Add Association", associations, awards },
      (err, html) => {
        if (err) {
          return res.status(500).send("Error rendering form");
        }
        res.render("dashboard", {
          body: html,
          title: "لوحة التحكم",
          role: role,
          statistics: statistics,
          notifications: notifications,
          quickLinks: quickLinks,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching associations");
  }
};

// New method: List associations for "الأعمال الخاصة" section
exports.listAssociations = async (req, res) => {
  try {
    const associations = await Association.find().sort({ name: 1 });
    req.app.render(
      "privateWorksAssociations",
      {
        title: "الأعمال الخاصة - الجمعيات",
        associations,
        user: req.user,
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering privateWorksAssociations:", err);
          return res.status(500).send("Error rendering associations");
        }
        res.render("dashboard", {
          title: "لوحة التحكم",
          role: req.user ? req.user.role : null,
          body: html,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching associations");
  }
};

// New method: Show awards for a specific association
exports.showAssociationAwards = async (req, res) => {
  try {
    const associationId = req.params.associationId;
    const association = await Association.findById(associationId).populate(
      "awards"
    );
    if (!association) {
      return res.status(404).send("Association not found");
    }
    req.app.render(
      "privateWorksAwards",
      {
        title: `الجوائز - ${association.name}`,
        association,
        awards: association.awards,
        user: req.user,
        layout: false, // Render without dashboard layout
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering privateWorksAwards:", err);
          return res.status(500).send("Error rendering awards");
        }
        res.send(html); // Send the HTML directly, not inside dashboard
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching awards");
  }
};

// New method: Show criteria for a specific award with evaluations and notes
exports.showAwardCriteria = async (req, res) => {
  try {
    const { associationId, awardId } = req.params;
    const award = await Award.findById(awardId).populate("criteria");
    if (!award) {
      return res.status(404).send("Award not found");
    }

    // Fetch existing reviews for this association and award
    const reviews = await CriterionReview.find({
      associationId,
      awardId,
    }).lean();

    // Map reviews by criterionId for easy lookup
    const reviewsMap = {};
    reviews.forEach((review) => {
      reviewsMap[review.criterionId.toString()] = review;
    });

    // const isModal = req.query.modal === "true";

    req.app.render(
      "privateWorksCriteria",
      {
        title: `المعايير - ${award.name}`,
        award,
        criteria: award.criteria,
        reviewsMap,
        associationId,
        user: req.user,
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering privateWorksCriteria:", err);
          return res.status(500).send("Error rendering criteria");
        }
        if (1 == 1) {
          // Render without dashboard layout for modal popup
          res.send(html);
        } else {
          // Render inside dashboard layout
          res.render("dashboard", {
            title: "لوحة التحكم",
            role: req.user ? req.user.role : null,
            body: html,
          });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching criteria");
  }
};

// New method: Save evaluation and notes for a criterion
exports.saveCriterionEvaluation = async (req, res) => {
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
    res.json({ success: true, review });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error saving evaluation" });
  }
};

exports.addAssociation = async (req, res, next) => {
  upload.single("image")(req, res, async function (err) {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading image");
    }
    try {
      const { name, taxRecordNumber, phoneNumber, creationDate } = req.body;
      let awards = req.body.awards || [];
      if (!Array.isArray(awards)) {
        awards = [awards];
      }
      const image = req.file ? req.file.filename : null;

      const newAssociation = new Association({
        image,
        name,
        taxRecordNumber,
        phoneNumber,
        creationDate,
        awards,
      });

      await newAssociation.save();

      res.redirect("/associations/add");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error adding association");
    }
  });
};

exports.renderReviewContent = async (req, res) => {
  try {
    const associationId = req.params.id;
    const association = await Association.findById(associationId).populate({
      path: "awards",
      populate: { path: "criteria" },
    });

    if (!association) {
      return res.status(404).send("Association not found");
    }

    const criteria = await Criteria.find({ associationId: associationId });

    // Render review.ejs without dashboard layout, only the inner content for modal
    req.app.render(
      "review",
      {
        title: "مراجعة الجمعية",
        association,
        criteria,
        methodologyText: "",
        attachedFiles: association.image
          ? [
              {
                filename: association.image,
                url: "/uploads/" + association.image,
              },
            ]
          : [],
        reviewComments: association.reviewComments || [],
        reviewStatus: association.reviewStatus,
        rejectionReason: association.rejectionReason,
        layout: false, // Disable layout rendering if using layout engine
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering review content for modal:", err);
          return res.status(500).send("Error rendering review content");
        }
        res.send(html);
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading review content");
  }
};

// Approve association
exports.approveAssociation = async (req, res) => {
  try {
    const associationId = req.params.id;
    const { comment, author } = req.body;

    const association = await Association.findById(associationId);
    if (!association) {
      return res.status(404).send("Association not found");
    }

    // Fix: Remove empty string or invalid entries from awards array
    let awards = association.awards || [];
    if (Array.isArray(awards)) {
      awards = awards.filter(
        (id) => id && id !== "" && mongoose.Types.ObjectId.isValid(id)
      );
    } else {
      awards = [];
    }
    association.awards = awards;

    // Update review status and add comment and history
    association.reviewStatus = "approved";
    if (comment) {
      association.reviewComments.push({ comment, author });
    }
    association.reviewHistory.push({
      status: "approved",
      comments: comment || "",
      date: new Date(),
    });
    association.rejectionReason = undefined;

    await association.save();

    res.redirect(`/associations/${associationId}/review`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error approving association");
  }
};

// New method: Get association by ID for editing
exports.getAssociationById = async (req, res) => {
  try {
    const associationId = req.params.id;
    const association = await Association.findById(associationId);
    if (!association) {
      return res.status(404).json({ message: "Association not found" });
    }
    res.json(association);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching association" });
  }
};

// New method: Update association
exports.updateAssociation = async (req, res) => {
  upload.single("image")(req, res, async function (err) {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).json({ message: "Error uploading image" });
    }
    try {
      const associationId = req.params.id;
      const { name, taxRecordNumber, phoneNumber, creationDate } = req.body;
      let awards = req.body.awards || [];
      if (!Array.isArray(awards)) {
        awards = [awards];
      }
      const image = req.file ? req.file.filename : null;

      const association = await Association.findById(associationId);
      if (!association) {
        return res.status(404).json({ message: "Association not found" });
      }

      association.name = name;
      association.taxRecordNumber = taxRecordNumber;
      association.phoneNumber = phoneNumber;
      association.creationDate = creationDate;
      association.awards = awards;
      if (image) {
        association.image = image;
      }

      await association.save();

      res.json({ message: "Association updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating association" });
    }
  });
};

const mongoose = require("mongoose");

exports.renderReviewScreen = async (req, res) => {
  try {
    const associationId = req.params.id;
    let association = await Association.findById(associationId).lean();

    if (!association) {
      return res.status(404).send("Association not found");
    }

    // Clean invalid award IDs from association document
    const validAwardIds = (association.awards || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validAwardIds.length !== (association.awards || []).length) {
      // Update association document to remove invalid award IDs
      await Association.findByIdAndUpdate(associationId, {
        awards: validAwardIds,
      });
      association.awards = validAwardIds;
    }

    // Populate awards with criteria
    association = await Association.findById(associationId)
      .populate({
        path: "awards",
        match: { _id: { $in: validAwardIds } },
        populate: { path: "criteria" },
      })
      .lean();

    if (!Array.isArray(association.awards)) {
      association.awards = [];
    }

    const criteria = await Criteria.find({ associationId: associationId });

    res.render("review", {
      title: "مراجعة الجمعية",
      association,
      criteria,
      reviewComments: association.reviewComments || [],
      reviewStatus: association.reviewStatus,
      rejectionReason: association.rejectionReason,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading review screen");
  }
};

exports.rejectAssociation = async (req, res) => {
  try {
    const associationId = req.params.id;
    const { comment, author, rejectionReason } = req.body;

    const association = await Association.findById(associationId);
    if (!association) {
      return res.status(404).send("Association not found");
    }

    // Update review status and add comment, rejection reason, and history
    association.reviewStatus = "rejected";
    if (comment) {
      association.reviewComments.push({ comment, author });
    }
    association.rejectionReason = rejectionReason || "";
    association.reviewHistory.push({
      status: "rejected",
      comments: comment || "",
      date: new Date(),
    });

    await association.save();

    res.redirect(`/associations/${associationId}/review`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error rejecting association");
  }
};
