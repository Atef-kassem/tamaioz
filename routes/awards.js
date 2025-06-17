const express = require("express");
const router = express.Router();
const awardController = require("../Controllers/awardController");
const multer = require("multer");
const path = require("path");

// Configure multer storage
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

router.get("/", awardController.getAllAwards);

router.get("/page", awardController.renderAwardPage);

// Use multer middleware to handle multiple files with field name 'attachments'
router.post("/", upload.array("attachments"), awardController.createAward);
router.put("/:id", upload.array("attachments"), awardController.updateAward);
router.delete("/:id", awardController.deleteAward);

module.exports = router;
