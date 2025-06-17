const express = require("express");
const router = express.Router();
const associationsController = require("../Controllers/associationsController");

router.get("/add", associationsController.renderAddAssociation);
router.post("/add", associationsController.addAssociation);

// Review screen route
router.get("/:id/review", associationsController.renderReviewScreen);
router.get("/:id/review-content", associationsController.renderReviewContent);

// Approve association
router.post("/:id/approve", associationsController.approveAssociation);

// Temporary reject association
router.post("/:id/reject", associationsController.rejectAssociation);

module.exports = router;
