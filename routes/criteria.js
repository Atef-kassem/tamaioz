const express = require("express");
const router = express.Router();
const criteriaController = require("../Controllers/criteriaController");
const multer = require("multer");
const path = require("path");

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

router.get("/", criteriaController.getAllCriteria);

router.get("/page", criteriaController.renderCriteriaPage);

router.post("/", criteriaController.createCriteria);
router.put("/:id", criteriaController.updateCriteria);
router.delete("/:id", criteriaController.deleteCriteria);

// New route for uploading attachments
router.post(
  "/:id/attachments",
  upload.array("attachments"),
  criteriaController.uploadAttachments
);

// New route for uploading attachments with text
router.post(
  "/:id/attachmentsWithText",
  upload.array("attachments"),
  criteriaController.uploadAttachmentsWithText
);

module.exports = router;
