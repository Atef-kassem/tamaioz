const bcrypt = require("bcrypt");
const User = require("../models/User");

// Render signup page
exports.getSignup = (req, res) => {
  res.render("signup");
};

// Handle signup form submission
exports.postSignup = async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).send("All fields are required.");
  }
  if (!["supervisor", "reviewer", "superadmin"].includes(role)) {
    return res.status(400).send("Invalid role specified.");
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username already exists.");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });
    await newUser.save();
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

// Render login page
exports.getLogin = (req, res) => {
  res.render("login");
};

// Handle login form submission
exports.postLogin = async (req, res) => {
  if (!req.body) {
    return res.status(400).send("Request body is missing.");
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("All fields are required.");
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send("Invalid username or password.");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid username or password.");
    }
    // Set user ID and role in session for authentication
    req.session.userId = user._id;
    req.session.userRole = user.role;
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

// Render profile page
exports.renderProfile = async (req, res) => {
  try {
    // Assuming user info is stored in req.user
    const user = req.user;
    if (!user) {
      return res.redirect("/login");
    }
    // Fetch fresh user data from DB if needed
    const userData = await User.findById(user._id).lean();
    res.render("profile", {
      user: userData,
      title: "الملف الشخصي",
      role: userData.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading profile");
  }
};
