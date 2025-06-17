const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema({
  name: { type: String, required: true },
  value: { type: String, default: "" },
  description: { type: String, default: "" }, // explanatory text
});

const criteriaSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["main", "sub", "point"], required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Criteria", default: null },
    points: { type: Number, default: 0 },
    methodology: { type: String, default: "" },
    attachments: [{ type: String }], // Array of file paths or URLs
    status: {
      type: String,
      enum: ["entered", "not-entered"],
      default: "not-entered",
    },
    definition: { type: String, default: "" }, // Added definition field
    properties: [propertySchema], // New properties field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Criteria", criteriaSchema);
