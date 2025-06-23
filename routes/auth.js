const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

router.put(
  "/users/:id/permissions",
  isAuthenticated,
  authController.updateUserPermissions
);

// Render signup page
router.get("/signup", authController.getSignup);

// Handle signup form submission
router.post("/signup", authController.postSignup);

// Render login page
router.get("/login", authController.getLogin);

// Handle login form submission
router.post("/login", authController.postLogin);

// Render profile page
router.get("/profile", isAuthenticated, authController.renderProfile);

// Handle logout
router.get("/logout", authController.logout);

module.exports = router;
