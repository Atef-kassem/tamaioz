const express = require("express");
const router = express.Router();
const reportsController = require("../Controllers/reportsController");

// GET reports screen without authentication
router.get("/", reportsController.showReportsScreen);

// POST generate report without authentication
router.post("/generate", reportsController.generateReport);

module.exports = router;
