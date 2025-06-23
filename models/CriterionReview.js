const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const criterionReviewSchema = new Schema(
  {
    associationId: {
      type: Schema.Types.ObjectId,
      ref: "Association",
      required: true,
    },
    awardId: {
      type: Schema.Types.ObjectId,
      ref: "Award",
      required: true,
    },
    criterionId: {
      type: Schema.Types.ObjectId,
      ref: "Criteria",
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CriterionReview", criterionReviewSchema);
