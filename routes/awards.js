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

// Use multer fields to handle 'image' single file and 'attachments' multiple files
const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "attachments", maxCount: 10 },
]);

router.get("/", awardController.getAllAwards);

router.get("/page", awardController.renderAwardPage);

router.get("/:id", awardController.getAwardById);

// Use multer middleware to handle image and attachments fields
router.post("/", uploadFields, awardController.createAward);
router.put("/:id", uploadFields, awardController.updateAward);
router.delete("/:id", awardController.deleteAward);

router.post("/duplicate/:id", awardController.duplicateAward);

module.exports = router;
