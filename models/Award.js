const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const awardSchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: String, required: true },
    number: { type: String, required: true },
    phoneNumber: { type: String }, // new field for phone number
    address: { type: String }, // new field for address
    image: { type: String }, // new field for award image path
    conditions: { type: String },
    explanatoryText: { type: String }, // new field for explanatory text
    attachments: [{ type: String }], // new field for attachment file paths
    criteria: [{ type: Schema.Types.ObjectId, ref: "Criteria" }],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Award", awardSchema);
