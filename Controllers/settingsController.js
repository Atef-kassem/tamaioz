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

exports.showPermissions = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  // Allow only superadmin to access permissions page
  if (req.user.role !== "superadmin") {
    return res.status(403).send("Access denied");
  }

  const User = require("../models/User");

  // Define all available permissions
  const allPermissions = [
    "view_awards",
    "add_awards",
    "edit_awards",
    "delete_awards",
    "duplicate_award",
    "view_elements",
    "add_elements",
    "edit_elements",
    "delete_elements",
    "add_criteria",
    "edit_criteria",
    "view_criteria_page",
    "delete_criteria",
    "view_criteria",
    "save_criteria_methodology",
    "save_criteria_definition",
    "upload_criteria_attachment",
    "view_sidebar_awards",
    "view_sidebar_elements",
    "save_award",
    "view_permissions", // New permission for viewing permissions
    "update_permissions", // New permission for updating permissions
    "manage_users", // New permission for managing users
    "manage_settings", // New permission for managing settings
    "view_statistics", // New permission for viewing statistics
  ];

  try {
    // Fetch all users including current superadmin
    const users = await User.find({}).lean();

    // Get selected user ID from query parameter or default to first user
    const selectedUserId =
      req.query.userId || (users.length > 0 ? users[0]._id.toString() : null);

    // Find selected user
    const selectedUser = users.find((u) => u._id.toString() === selectedUserId);

    // Render the permissions_content partial to HTML with user permissions
    req.app.render(
      "partials/permissions_content",
      {
        user: req.user,
        users,
        selectedUser,
        permissions: selectedUser ? selectedUser.permissions : [],
        allPermissions,
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
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users");
  }
};

exports.updatePermissions = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  try {
    const User = require("../models/User");

    // Define all available permissions
    const allPermissions = [
      "view_awards",
      "add_awards",
      "edit_awards",
      "delete_awards",
      "duplicate_award",
      "view_elements",
      "add_elements",
      "edit_elements",
      "delete_elements",
      "add_criteria",
      "edit_criteria",
      "view_criteria_page",
      "delete_criteria",
      "view_criteria",
      "save_criteria_methodology",
      "save_criteria_definition",
      "upload_criteria_attachment",
      "view_sidebar_awards",
      "view_sidebar_elements",
      "save_award",
      "view_permissions", // New permission for viewing permissions
      "update_permissions", // New permission for updating permissions
      "manage_users", // New permission for managing users
      "manage_settings", // New permission for managing settings
      "view_statistics", // New permission for viewing statistics
    ];

    // Extract permissions from form submission
    const submittedPermissions = allPermissions.filter(
      (perm) => req.body[perm] === "on"
    );

    // Get userId from form submission
    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    // Update selected user's permissions and updatedAt timestamp in DB
    await User.findByIdAndUpdate(userId, {
      permissions: submittedPermissions,
      updatedAt: new Date(),
    });

    // If the updated user is the logged-in user, destroy session to force logout
    if (req.user._id.toString() === userId) {
      req.session.destroy((err) => {
        if (err) {
          console.error(
            "Error destroying session after permissions update:",
            err
          );
          return res.status(500).send("Error updating permissions");
        }
        // Redirect to login after logout
        res.redirect("/login");
      });
    } else {
      // Redirect back to permissions page with selected userId query param
      res.redirect(`/settings/permissions?userId=${userId}`);
    }
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

exports.updateGeneralSettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const { language } = req.body;
    const User = require("../models/User");

    if (!["ar", "en"].includes(language)) {
      req.flash("error", "اللغة غير صالحة.");
      return res.redirect("/settings");
    }

    await User.findByIdAndUpdate(req.user._id, { language });
    req.flash("success", "تم تحديث الإعدادات العامة بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating general settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث الإعدادات العامة.");
    res.redirect("/settings");
  }
};

exports.updateSecuritySettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const { password } = req.body;
    const User = require("../models/User");

    if (!password || password.length < 6) {
      req.flash("error", "كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return res.redirect("/settings");
    }

    // Hash password before saving (assuming bcrypt is used)
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });
    req.flash("success", "تم تحديث كلمة المرور بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating security settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث كلمة المرور.");
    res.redirect("/settings");
  }
};

exports.updateNotificationsSettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const emailNotifications = req.body.emailNotifications === "on";
    const notificationFrequency = req.body.notificationFrequency;
    const User = require("../models/User");

    if (!["immediate", "daily", "weekly"].includes(notificationFrequency)) {
      req.flash("error", "تكرار الإشعارات غير صالح.");
      return res.redirect("/settings");
    }

    await User.findByIdAndUpdate(req.user._id, {
      emailNotifications,
      notificationFrequency,
    });
    req.flash("success", "تم تحديث إعدادات الإشعارات بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating notifications settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث إعدادات الإشعارات.");
    res.redirect("/settings");
  }
};

exports.updatePrivacySettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const profileVisibility = req.body.profileVisibility;
    const User = require("../models/User");

    if (!["public", "private"].includes(profileVisibility)) {
      req.flash("error", "إعدادات الخصوصية غير صالحة.");
      return res.redirect("/settings");
    }

    await User.findByIdAndUpdate(req.user._id, { profileVisibility });
    req.flash("success", "تم تحديث إعدادات الخصوصية بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث إعدادات الخصوصية.");
    res.redirect("/settings");
  }
};

exports.updateThemeSettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const theme = req.body.theme;
    const User = require("../models/User");

    if (!["light", "dark"].includes(theme)) {
      req.flash("error", "إعدادات السمة غير صالحة.");
      return res.redirect("/settings");
    }

    await User.findByIdAndUpdate(req.user._id, { theme });
    req.flash("success", "تم تحديث إعدادات السمة بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating theme settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث إعدادات السمة.");
    res.redirect("/settings");
  }
};

exports.updateTimezoneSettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const timezone = req.body.timezone;
    const User = require("../models/User");

    if (!timezone || timezone.trim() === "") {
      req.flash("error", "المنطقة الزمنية غير صالحة.");
      return res.redirect("/settings");
    }

    await User.findByIdAndUpdate(req.user._id, { timezone });
    req.flash("success", "تم تحديث إعدادات المنطقة الزمنية بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating timezone settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث إعدادات المنطقة الزمنية.");
    res.redirect("/settings");
  }
};

exports.updateTwoFactorAuthSettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const twoFactorAuth = req.body.twoFactorAuth === "on";
    const User = require("../models/User");

    await User.findByIdAndUpdate(req.user._id, { twoFactorAuth });
    req.flash("success", "تم تحديث إعدادات المصادقة الثنائية بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating two-factor auth settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث إعدادات المصادقة الثنائية.");
    res.redirect("/settings");
  }
};

exports.updateShowOnlineStatusSettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const showOnlineStatus = req.body.showOnlineStatus === "on";
    const User = require("../models/User");

    await User.findByIdAndUpdate(req.user._id, { showOnlineStatus });
    req.flash("success", "تم تحديث إعدادات حالة الظهور على الإنترنت بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating show online status settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث إعدادات حالة الظهور على الإنترنت.");
    res.redirect("/settings");
  }
};

exports.updateAutoSaveDraftsSettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const autoSaveDrafts = req.body.autoSaveDrafts === "on";
    const User = require("../models/User");

    await User.findByIdAndUpdate(req.user._id, { autoSaveDrafts });
    req.flash("success", "تم تحديث إعدادات الحفظ التلقائي للمسودات بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating auto save drafts settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث إعدادات الحفظ التلقائي للمسودات.");
    res.redirect("/settings");
  }
};

exports.updateDataSharingConsentSettings = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  try {
    const dataSharingConsent = req.body.dataSharingConsent === "on";
    const User = require("../models/User");

    await User.findByIdAndUpdate(req.user._id, { dataSharingConsent });
    req.flash("success", "تم تحديث إعدادات موافقة مشاركة البيانات بنجاح.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Error updating data sharing consent settings:", error);
    req.flash("error", "حدث خطأ أثناء تحديث إعدادات موافقة مشاركة البيانات.");
    res.redirect("/settings");
  }
};
