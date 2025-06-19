const mongoose = require("mongoose");

const elementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["main", "sub", "subsub"], required: true },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Element",
    default: null,
  },
  attachment: { type: String, default: null }, // URL or file path
  note: { type: String, default: "" },
  scale: { type: Number, default: null },
  indicator: { type: String, default: "" },
  rating: { type: Number, min: 1, max: 5, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Element", elementSchema);
