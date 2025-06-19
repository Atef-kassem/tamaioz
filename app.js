require("dotenv").config();

const express = require("express");
const path = require("path");

const session = require("express-session");
const flash = require("connect-flash");
const authRoutes = require("./routes/auth");
const criteriaRoutes = require("./routes/criteria");
const associationsRoutes = require("./routes/associations");
const elementsRoutes = require("./routes/elements");
const reportsRouter = require("./routes/reports");
const submissionsRoutes = require("./routes/submissions");
const awardsRoutes = require("./routes/awards");
const settingsRoutes = require("./routes/settings");
const { db } = require("./models/index");

const app = express();

// Set up session middleware
app.use(
  session({
    secret: "your-secret-key", // replace with a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set secure: true if using HTTPS
  })
);

// Use flash middleware
app.use(flash());

// Middleware to populate req.user from session
app.use(async (req, res, next) => {
  if (req.session && req.session.userId) {
    const User = require("./models/User");
    try {
      const user = await User.findById(req.session.userId).lean();
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.error("Error fetching user from session:", err);
    }
  }
  next();
});

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Register routes
app.use("/reports", reportsRouter);
app.use("/submissions", submissionsRoutes);
app.use("/settings", settingsRoutes);
app.use("/", authRoutes);
app.use("/api/criteria", criteriaRoutes);
app.use("/associations", associationsRoutes);
app.use("/awards", awardsRoutes);
app.use("/elements", elementsRoutes);

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Basic home route
app.get("/", (req, res) => {
  res.send("Welcome to the Home Page");
});

// Profile route to render profile content inside dashboard layout
app.get("/profile", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const role = req.user.role;

  // Render the profile_content partial to HTML
  app.render(
    "partials/profile_content",
    { user: req.user, title: "الملف الشخصي" },
    (err, profileHtml) => {
      if (err) {
        console.error("Error rendering profile content:", err);
        return res.status(500).send("Error rendering profile page");
      }

      // Render the dashboard with profileHtml as body
      res.render("dashboard", {
        role,
        body: profileHtml,
        statistics: {},
        notifications: [],
        quickLinks: [],
      });
    }
  );
});

app.get("/dashboard", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const role = req.user.role;

  let statistics = {};
  let notifications = [];
  let quickLinks = [];

  // Data for review content
  let showReviewContent = false;
  let association = null;
  let criteria = [];
  let methodologyText = "";
  let attachedFiles = [];
  let reviewComments = [];

  const Association = require("./models/Association");
  const CriteriaModel = require("./models/Criteria");

  if (role === "superadmin") {
    statistics = {
      criteriaEntered: 20,
      criteriaRemaining: 0,
      submissionStatusCounts: {
        pending: 1,
        approved: 15,
        rejected: 0,
      },
    };
    notifications = [
      { id: 1, message: "New system-wide notification for superadmin." },
      { id: 2, message: "System maintenance scheduled." },
    ];
    quickLinks = [
      { name: "Manage Users", url: "/users" },
      { name: "System Settings", url: "/settings" },
    ];

    app.render(
      "partials/dashboard_superadmin",
      { statistics, notifications, quickLinks },
      (err, html) => {
        if (err) {
          return res.status(500).send("Error rendering dashboard");
        }
        res.render("dashboard", {
          user: req.user,
          role,
          statistics,
          notifications,
          quickLinks,
          body: html,
        });
      }
    );
  } else if (role === "supervisor") {
    statistics = {
      criteriaEntered: 10,
      criteriaRemaining: 5,
      submissionStatusCounts: {
        pending: 3,
        approved: 7,
        rejected: 2,
      },
    };
    notifications = [
      { id: 1, message: "New submission pending review." },
      { id: 2, message: "Meeting scheduled for supervisors." },
    ];
    quickLinks = [
      { name: "Manage Criteria", url: "/criteria" },
      { name: "Review Submissions", url: "/submissions/review" },
    ];

    // Fetch data for reports content
    let associations = [];
    let criteriaList = [];
    let showReportsContent = false;

    try {
      associations = await Association.find().lean();
      criteriaList = await CriteriaModel.find().lean();
      showReportsContent = true;
    } catch (err) {
      console.error("Error fetching data for reports content:", err);
      showReportsContent = false;
    }

    // Example: Show review content for a specific association (fetch from DB)
    try {
      association = await Association.findOne().lean();
      if (!association) {
        console.warn("No association found for review content");
        showReviewContent = false;
      } else {
        criteria = await CriteriaModel.find().lean();
        methodologyText = "نص المنهجية والتطبيق"; // Placeholder text
        attachedFiles = []; // Placeholder empty array
        reviewComments = association.reviewComments || [];
        showReviewContent = true;
      }
    } catch (err) {
      console.error("Error fetching review content data:", err);
    }

    if (showReviewContent) {
      app.render(
        "partials/review_content",
        {
          association,
          criteria,
          methodologyText,
          attachedFiles,
          reviewComments,
        },
        (err, reviewHtml) => {
          if (err) {
            return res.status(500).send("Error rendering review content");
          }
          app.render(
            "partials/dashboard_supervisor",
            { statistics, notifications, quickLinks },
            (err2, dashboardHtml) => {
              if (err2) {
                return res.status(500).send("Error rendering dashboard");
              }
              res.render("dashboard", {
                user: req.user,
                role,
                statistics,
                notifications,
                quickLinks,
                body: reviewHtml + dashboardHtml,
              });
            }
          );
        }
      );
      return;
    }

    app.render(
      "partials/dashboard_supervisor",
      { statistics, notifications, quickLinks },
      (err, html) => {
        if (err) {
          return res.status(500).send("Error rendering dashboard");
        }
        res.render("dashboard", {
          user: req.user,
          role,
          statistics,
          notifications,
          quickLinks,
          body: html,
        });
      }
    );
  } else if (role === "reviewer") {
    statistics = {
      criteriaEntered: 7,
      criteriaRemaining: 8,
      submissionStatusCounts: {
        pending: 5,
        approved: 4,
        rejected: 1,
      },
    };
    notifications = [
      { id: 1, message: "New criteria assigned for review." },
      { id: 2, message: "Reminder: Submit your reviews." },
    ];
    quickLinks = [
      { name: "View Criteria", url: "/criteria" },
      { name: "Submit Reviews", url: "/reviews/submit" },
    ];

    app.render(
      "partials/dashboard_reviewer",
      { statistics, notifications, quickLinks },
      (err, html) => {
        if (err) {
          return res.status(500).send("Error rendering dashboard");
        }
        res.render("dashboard", {
          user: req.user,
          role,
          statistics,
          notifications,
          quickLinks,
          body: html,
        });
      }
    );
  } else {
    res.render("dashboard", {
      user: req.user,
      role,
      statistics,
      notifications,
      quickLinks,
      body: "<p>دور المستخدم غير معروف.</p>",
    });
  }
});

app.get("/criteria", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const role = req.user.role;

  let statistics = {};
  let notifications = [];
  let quickLinks = [];

  if (role === "supervisor") {
    statistics = {
      criteriaEntered: 10,
      criteriaRemaining: 5,
      submissionStatusCounts: {
        pending: 3,
        approved: 7,
        rejected: 2,
      },
    };
    notifications = [
      { id: 1, message: "New submission pending review." },
      { id: 2, message: "Meeting scheduled for supervisors." },
    ];
    quickLinks = [
      { name: "Manage Criteria", url: "/criteria" },
      { name: "Review Submissions", url: "/submissions/review" },
    ];
  } else if (role === "reviewer") {
    statistics = {
      criteriaEntered: 7,
      criteriaRemaining: 8,
      submissionStatusCounts: {
        pending: 5,
        approved: 4,
        rejected: 1,
      },
    };
    notifications = [
      { id: 1, message: "New criteria assigned for review." },
      { id: 2, message: "Reminder: Submit your reviews." },
    ];
    quickLinks = [
      { name: "View Criteria", url: "/criteria" },
      { name: "Submit Reviews", url: "/reviews/submit" },
    ];
  }

  app.render("criteriaContent", {}, (err, html) => {
    if (err) {
      return res.status(500).send("Server error");
    }
    res.render("dashboard", {
      body: html,
      role: role,
      statistics: statistics,
      notifications: notifications,
      quickLinks: quickLinks,
    });
  });
});

app.get("/criterias", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const role = req.user.role;

  let statistics = {};
  let notifications = [];
  let quickLinks = [];

  if (role === "supervisor") {
    statistics = {
      criteriaEntered: 10,
      criteriaRemaining: 5,
      submissionStatusCounts: {
        pending: 3,
        approved: 7,
        rejected: 2,
      },
    };
    notifications = [
      { id: 1, message: "New submission pending review." },
      { id: 2, message: "Meeting scheduled for supervisors." },
    ];
    quickLinks = [
      { name: "Manage Criteria", url: "/criterias" },
      { name: "Review Submissions", url: "/submissions/review" },
    ];
  } else if (role === "reviewer") {
    statistics = {
      criteriaEntered: 7,
      criteriaRemaining: 8,
      submissionStatusCounts: {
        pending: 5,
        approved: 4,
        rejected: 1,
      },
    };
    notifications = [
      { id: 1, message: "New criteria assigned for review." },
      { id: 2, message: "Reminder: Submit your reviews." },
    ];
    quickLinks = [
      { name: "View Criteria", url: "/criterias" },
      { name: "Submit Reviews", url: "/reviews/submit" },
    ];
  }

  app.render("criteriaContent", {}, (err, html) => {
    if (err) {
      return res.status(500).send("Server error");
    }
    res.render("dashboard", {
      body: html,
      role: role,
      statistics: statistics,
      notifications: notifications,
      quickLinks: quickLinks,
    });
  });
});

// Start server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please kill the process using this port or use a different port.`
    );
    console.error("To find the process using the port, run:");
    console.error("  netstat -ano | findstr :8000");
    console.error("Then kill the process by PID:");
    console.error("  taskkill /PID <PID> /F");
  } else {
    console.error("Server error:", error);
  }
});
