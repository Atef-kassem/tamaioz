const express = require("express");
const router = express.Router();
const reportsController = require("../Controllers/reportsController");

// GET reports screen without authentication
router.get("/", reportsController.showReportsScreen);

// POST generate report without authentication
router.post("/generate", reportsController.generateReport);

// New route for criteria report page
router.get("/criteria-report", reportsController.showCriteriaReport);

// New route for criteria report inside dashboard layout
router.get(
  "/criteria-report-dashboard",
  reportsController.showCriteriaReportInDashboard
);

module.exports = router;
