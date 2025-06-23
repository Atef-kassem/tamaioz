const express = require("express");
const router = express.Router();
const criteriaController = require("../Controllers/criteriaController");
const multer = require("multer");
const path = require("path");
const ensurePermission = require("../middleware/ensurePermission");

// Configure multer for file uploads
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

router.get(
  "/",
  ensurePermission("view_criteria"),
  criteriaController.getAllCriteria
);

router.get(
  "/page",
  ensurePermission("view_criteria_page"),
  criteriaController.renderCriteriaPage
);

router.post(
  "/",
  ensurePermission("add_criteria"),
  criteriaController.createCriteria
);
router.put(
  "/:id",
  ensurePermission("save_criteria_methodology"),
  criteriaController.updateCriteria
);
router.delete(
  "/:id",
  ensurePermission("delete_criteria"),
  criteriaController.deleteCriteria
);

// New route for uploading attachments
router.post(
  "/:id/attachments",
  ensurePermission("upload_criteria_attachment"),
  upload.array("attachments"),
  criteriaController.uploadAttachments
);

// New route for uploading attachments with text
router.post(
  "/:id/attachmentsWithText",
  ensurePermission("upload_criteria_attachment"),
  upload.array("attachments"),
  criteriaController.uploadAttachmentsWithText
);

// New routes for criterion reviews
router.get(
  "/reviews/:associationId/:awardId",
  ensurePermission("view_reviews"),
  criteriaController.getCriterionReviews
);

router.post(
  "/reviews/:associationId/:awardId/:criterionId",
  ensurePermission("edit_reviews"),
  criteriaController.saveCriterionReview
);

module.exports = router;
