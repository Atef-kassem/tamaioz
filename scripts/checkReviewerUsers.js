const mongoose = require("mongoose");
const User = require("../models/User");
const config = require("../config/config.json");

const mongoUri =
  config.development && config.development.url
    ? config.development.url
    : "mongodb://localhost:27017/your_database_name"; // Adjust as needed

async function checkReviewerUsers() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const reviewers = await User.find({ role: "reviewer" }).lean();
    if (reviewers.length === 0) {
      console.log("No reviewer users found in the database.");
    } else {
      console.log("Reviewer users:");
      reviewers.forEach((user) => {
        console.log(`- Username: ${user.username}, Email: ${user.email}`);
      });
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error checking reviewer users:", error);
  }
}

checkReviewerUsers();
