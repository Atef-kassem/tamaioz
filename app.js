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
// const submissionsRoutes = require("./routes/submissions"); // Removed as per request
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

const ensureSuperadminPermissions = require("./middleware/ensureSuperadminPermissions");

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

// Use the middleware early in the request pipeline
app.use(ensureSuperadminPermissions);

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Register routes
app.use("/reports", reportsRouter);
// app.use("/submissions", submissionsRoutes); // Removed as per request
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
    try {
      const criteriaEnteredCount = await Criteria.countDocuments({
        status: "entered",
      });
      const criteriaRemainingCount = await Criteria.countDocuments({
        status: "not-entered",
      });

      const associationStatusCounts = await Association.aggregate([
        {
          $group: {
            _id: "$reviewStatus",
            count: { $sum: 1 },
          },
        },
      ]);

      const submissionStatusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      associationStatusCounts.forEach((item) => {
        if (item._id === "pending") submissionStatusCounts.pending = item.count;
        else if (item._id === "approved")
          submissionStatusCounts.approved = item.count;
        else if (item._id === "rejected")
          submissionStatusCounts.rejected = item.count;
      });

      statistics = {
        criteriaEntered: criteriaEnteredCount,
        criteriaRemaining: criteriaRemainingCount,
        submissionStatusCounts,
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
        { statistics, notifications, quickLinks, user: req.user },
        (err, html) => {
          if (err) {
            console.error("Error rendering dashboard_superadmin partial:", err);
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
    } catch (error) {
      console.error("Error fetching dashboard data for superadmin:", error);
      res.status(500).send("Error fetching dashboard data");
    }
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
    quickLinks = [{ name: "Manage Criteria", url: "/criteria" }];

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
            console.error("Error rendering review_content partial:", err);
            return res.status(500).send("Error rendering review content");
          }
          app.render(
            "partials/dashboard_supervisor",
            { statistics, notifications, quickLinks, user: req.user },
            (err2, dashboardHtml) => {
              if (err2) {
                console.error(
                  "Error rendering dashboard_supervisor partial:",
                  err2
                );
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
      { statistics, notifications, quickLinks, user: req.user },
      (err, html) => {
        if (err) {
          console.error("Error rendering dashboard_supervisor partial:", err);
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

    const associations = await Association.find().lean();

    app.render(
      "partials/dashboard_reviewer",
      { statistics, notifications, quickLinks, associations },
      (err, html) => {
        if (err) {
          console.error("Error rendering dashboard_reviewer partial:", err);
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

const Association = require("./models/Association");
const Award = require("./models/Award");
const Criteria = require("./models/Criteria");

app.get("/analysis", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const role = req.user.role;

  // Aggregate data for charts
  try {
    // Associations by reviewStatus
    const associationsByStatusRaw = await Association.aggregate([
      { $group: { _id: "$reviewStatus", count: { $sum: 1 } } },
    ]);

    // Awards by status
    const awardsByStatusRaw = await Award.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Criteria count by type
    const criteriaCountByTypeRaw = await Criteria.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    // Average points per criteria type
    const avgPointsByTypeRaw = await Criteria.aggregate([
      {
        $group: {
          _id: "$type",
          avgPoints: { $avg: "$points" },
        },
      },
    ]);

    // Number of awards linked to associations
    const awardsCountPerAssociationRaw = await Association.aggregate([
      {
        $project: {
          name: 1,
          awardsCount: {
            $cond: {
              if: { $isArray: "$awards" },
              then: { $size: "$awards" },
              else: 0,
            },
          },
        },
      },
    ]);

    // User provided criteria ratings data (hardcoded here for example)
    const userCriteriaRatings = [
      { criterion: "العمل", rating: 4 },
      { criterion: "سيسي", rating: 2 },
      { criterion: "سيسي", rating: 4 },
      { criterion: "سييس", rating: 3 },
      { criterion: "الحب", rating: 3 },
      { criterion: "الاصدقاء", rating: 0 },
    ];

    // Aggregate user criteria ratings by criterion name (average if duplicates)
    const ratingsMap = {};
    userCriteriaRatings.forEach(({ criterion, rating }) => {
      if (!ratingsMap[criterion]) {
        ratingsMap[criterion] = { total: 0, count: 0 };
      }
      ratingsMap[criterion].total += rating;
      ratingsMap[criterion].count += 1;
    });

    const criteriaLabels = Object.keys(ratingsMap);
    const criteriaData = criteriaLabels.map(
      (label) => ratingsMap[label].total / ratingsMap[label].count
    );

    const criteriaRatingsData = {
      labels: criteriaLabels,
      datasets: [
        {
          label: "تقييمات المعايير",
          data: criteriaData,
          backgroundColor: "#f67019",
        },
      ],
    };

    // Transform raw data to chart.js format
    function transformToChartData(rawData, labelKey, dataKey) {
      return {
        labels: rawData.map(
          (item) => item[labelKey] || item._id || "غير معروف"
        ),
        datasets: [
          {
            label: dataKey,
            data: rawData.map(
              (item) => item[dataKey] || item.count || item.avgPoints || 0
            ),
            backgroundColor: [
              "#4dc9f6",
              "#f67019",
              "#f53794",
              "#537bc4",
              "#acc236",
              "#166a8f",
              "#00a950",
              "#58595b",
              "#8549ba",
            ],
          },
        ],
      };
    }

    const data = {
      associationsStatus: transformToChartData(
        associationsByStatusRaw,
        "_id",
        "count"
      ),
      awardsStatus: transformToChartData(awardsByStatusRaw, "_id", "count"),
      criteriaCount: transformToChartData(
        criteriaCountByTypeRaw,
        "_id",
        "count"
      ),
      avgPoints: transformToChartData(avgPointsByTypeRaw, "_id", "avgPoints"),
      awardsPerAssociation: {
        labels: awardsCountPerAssociationRaw.map(
          (item) => item.name || "غير معروف"
        ),
        datasets: [
          {
            label: "عدد الجوائز",
            data: awardsCountPerAssociationRaw.map(
              (item) => item.awardsCount || 0
            ),
            backgroundColor: "#4dc9f6",
          },
        ],
      },
      criteriaRatings: criteriaRatingsData,
    };

    // Render dashboard with analysis_content partial as body
    res.render("dashboard", {
      role,
      body: await new Promise((resolve, reject) => {
        app.render("partials/analysis_content", { data }, (err, html) => {
          if (err) reject(err);
          else resolve(html);
        });
      }),
    });
  } catch (error) {
    console.error("Error fetching analysis data:", error);
    res.status(500).send("Error fetching analysis data");
  }
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
