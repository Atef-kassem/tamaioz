const express = require("express");
const router = express.Router();
const associationsController = require("../Controllers/associationsController");

// Existing routes
router.get("/add", associationsController.renderAddAssociation);
router.post("/add", associationsController.addAssociation);

// Review screen route
router.get("/:id/review", associationsController.renderReviewScreen);
router.get("/:id/review-content", associationsController.renderReviewContent);

// Approve association
router.post("/:id/approve", associationsController.approveAssociation);

// Temporary reject association
router.post("/:id/reject", associationsController.rejectAssociation);

// New routes for "الأعمال الخاصة" section
router.get("/private-works", associationsController.listAssociations);
router.get(
  "/private-works/:associationId/awards",
  associationsController.showAssociationAwards
);
router.get(
  "/private-works/:associationId/awards/:awardId/criteria",
  associationsController.showAwardCriteria
);
router.post(
  "/private-works/:associationId/awards/:awardId/criteria/:criterionId/evaluate",
  associationsController.saveCriterionEvaluation
);

// New routes for editing associations
router.get("/:id/edit", associationsController.getAssociationById);
router.post("/:id/edit", associationsController.updateAssociation);

module.exports = router;
