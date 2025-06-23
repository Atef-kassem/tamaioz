const User = require("../models/User");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Update user permissions by ID
exports.updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: "Permissions must be an array" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.permissions = permissions;
    await user.save();
    res.json({ message: "Permissions updated", permissions: user.permissions });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Render signup page
exports.getSignup = (req, res) => {
  res.render("signup", { title: "Signup" });
};

// Handle signup form submission
exports.postSignup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).send("All fields are required");
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "reviewer",
    });
    await newUser.save();
    res.redirect("/login");
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send("Server error");
  }
};

// Render login page
exports.getLogin = (req, res) => {
  res.render("login", { title: "Login" });
};

const mongoose = require("mongoose");

// Handle login form submission
exports.postLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).send("Username/Email and password are required");
    }
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });
    if (!user) {
      return res.status(401).send("Invalid credentials");
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send("Invalid credentials");
    }
    req.session.userId = user._id;
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Server error");
  }
};

// Render profile page
exports.renderProfile = (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  res.render("profile", {
    user: req.user,
    title: "Profile",
    role: req.user.role,
  });
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Server error");
    }
    res.redirect("/login");
  });
};
