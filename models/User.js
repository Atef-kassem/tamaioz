const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["supervisor", "reviewer", "superadmin"], // "supervisor" (مشرف الجمعية), "reviewer" (مراجع), "superadmin"
      required: true,
      default: "reviewer",
    },
    permissions: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      enum: ["ar", "en"],
      default: "ar",
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    notificationFrequency: {
      type: String,
      enum: ["immediate", "daily", "weekly"],
      default: "immediate",
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    twoFactorAuth: {
      type: Boolean,
      default: false,
    },
    showOnlineStatus: {
      type: Boolean,
      default: true,
    },
    autoSaveDrafts: {
      type: Boolean,
      default: true,
    },
    dataSharingConsent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
