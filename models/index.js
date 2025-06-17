const mongoose = require("mongoose");
const User = require("./User");
const Criteria = require("./Criteria");
const Award = require("./Award");
const Association = require("./Association");
require("dotenv").config();

const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

const db = mongoose.connection;

db.on("error", (error) => console.error("MongoDB connection error:", error));

module.exports = {
  db,
  User,
  Criteria,
  Award,
  Association,
};
