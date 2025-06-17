const path = require("path");
const { Association, Criteria } = require("../models");
const multer = require("multer");

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

exports.renderAddAssociation = async (req, res) => {
  try {
    const associations = await Association.find().sort({ createdAt: -1 });
    const awards = await require("../models/Award")
      .find()
      .sort({ createdAt: -1 });
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

exports.renderReviewScreen = async (req, res) => {
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
