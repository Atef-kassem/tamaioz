const express = require("express");
const router = express.Router();
const Association = require("../models/Association");
const Criteria = require("../models/Criteria");

// GET /submissions/review
router.get("/review", async (req, res) => {
  try {
    const association = await Association.findOne().lean();
    if (!association) {
      return res.status(404).send("No association found");
    }
    const criteria = await Criteria.find().lean();

    // Concatenate all non-empty methodology fields from criteria
    const methodologyText = criteria
      .map((c) => c.methodology)
      .filter((text) => text && text.trim() !== "")
      .join("\n\n");

    // Aggregate all attachments from criteria into attachedFiles array
    const attachedFiles = [];
    criteria.forEach((c) => {
      if (Array.isArray(c.attachments)) {
        c.attachments.forEach((filePath) => {
          attachedFiles.push({
            url: filePath,
            filename:
              filePath.split("/").pop() ||
              filePath.split("\\").pop() ||
              filePath,
          });
        });
      }
    });

    // Pass reviewComments from association
    const reviewComments = association.reviewComments || [];

    res.render("review", {
      association,
      criteria,
      methodologyText,
      attachedFiles,
      reviewComments,
    });
  } catch (err) {
    console.error("Error fetching data for review:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
