exports.showSettings = (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  // Get flash messages for success or error
  const successMessage = req.flash("success");
  const errorMessage = req.flash("error");

  // Render the settings_content partial to HTML
  req.app.render(
    "partials/settings_content",
    { user: req.user, title: "الإعدادات", successMessage, errorMessage },
    (err, settingsHtml) => {
      if (err) {
        console.error("Error rendering settings content:", err);
        return res.status(500).send("Error rendering settings page");
      }

      // Render the dashboard with settingsHtml as body
      res.render("dashboard", {
        user: req.user,
        role: req.user.role,
        body: settingsHtml,
        statistics: {},
        notifications: [],
        quickLinks: [],
      });
    }
  );
};

exports.showPermissions = (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  // Render the permissions_content partial to HTML with user permissions
  req.app.render(
    "partials/permissions_content",
    {
      user: req.user,
      permissions: req.user.permissions || [],
      title: "الصلاحيات",
    },
    (err, permissionsHtml) => {
      if (err) {
        console.error("Error rendering permissions content:", err);
        return res.status(500).send("Error rendering permissions page");
      }

      // Render the dashboard with permissionsHtml as body
      res.render("dashboard", {
        user: req.user,
        role: req.user.role,
        body: permissionsHtml,
        statistics: {},
        notifications: [],
        quickLinks: [],
      });
    }
  );
};

exports.updatePermissions = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  try {
    const User = require("../models/User");
    // Extract permissions from form submission
    // The form sends permission1, permission2, permission3 as checkbox names
    const submittedPermissions = [];
    if (req.body.permission1) submittedPermissions.push("permission1");
    if (req.body.permission2) submittedPermissions.push("permission2");
    if (req.body.permission3) submittedPermissions.push("permission3");

    // Update user's permissions in DB
    await User.findByIdAndUpdate(req.user._id, {
      permissions: submittedPermissions,
    });

    // Redirect back to permissions page with success message (optional)
    res.redirect("/settings/permissions");
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).send("Error updating permissions");
  }
};

exports.updateAccount = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  try {
    const User = require("../models/User");
    const { username, email } = req.body;

    // Basic validation
    if (!username || !email) {
      req.flash("error", "يرجى ملء جميع الحقول المطلوبة.");
      return res.redirect("/settings");
    }

    // Check if username or email is already taken by another user
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      req.flash("error", "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل.");
      return res.redirect("/settings");
    }

    // Update user data
    await User.findByIdAndUpdate(req.user._id, { username, email });

    req.flash("success", "تم تحديث بيانات الحساب بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating account:", error);
    req.flash("error", "حدث خطأ أثناء تحديث بيانات الحساب.");
    res.redirect("/settings");
  }
};
