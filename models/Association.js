const mongoose = require("mongoose");

const associationSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    taxRecordNumber: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    creationDate: {
      type: Date,
      required: true,
    },
    awards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Award",
        required: false,
      },
    ],
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewComments: [
      {
        comment: String,
        author: String,
        date: { type: Date, default: Date.now },
      },
    ],
    rejectionReason: {
      type: String,
      required: false,
    },
    reviewHistory: [
      {
        status: String,
        comments: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Association = mongoose.model("Association", associationSchema);

module.exports = Association;
