const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Render signup page
router.get("/signup", authController.getSignup);

// Handle signup form submission
router.post("/signup", authController.postSignup);

// Render login page
router.get("/login", authController.getLogin);

// Handle login form submission
router.post("/login", authController.postLogin);

// Render profile page
router.get("/profile", authController.renderProfile);

module.exports = router;
