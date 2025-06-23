const express = require("express");
const router = express.Router();
const settingsController = require("../Controllers/settingsController");

// GET route to show settings page
router.get("/", settingsController.showSettings);

// GET route to show permissions page
router.get("/permissions", settingsController.showPermissions);

// POST route to update permissions
router.post("/permissions", settingsController.updatePermissions);

// إعدادات عامة
router.post("/general", settingsController.updateGeneralSettings);
// إعدادات الأمان
router.post("/security", settingsController.updateSecuritySettings);
// إعدادات الإشعارات
router.post("/notifications", settingsController.updateNotificationsSettings);
// إعدادات الخصوصية
router.post("/privacy", settingsController.updatePrivacySettings);
// إعدادات السمة
router.post("/theme", settingsController.updateThemeSettings);
// إعدادات المنطقة الزمنية
router.post("/timezone", settingsController.updateTimezoneSettings);
// إعدادات المصادقة الثنائية
router.post("/twoFactorAuth", settingsController.updateTwoFactorAuthSettings);
// إعدادات حالة الظهور على الإنترنت
router.post(
  "/showOnlineStatus",
  settingsController.updateShowOnlineStatusSettings
);
// إعدادات حفظ المسودات تلقائيًا
router.post("/autoSaveDrafts", settingsController.updateAutoSaveDraftsSettings);
// إعدادات موافقة مشاركة البيانات
router.post(
  "/dataSharingConsent",
  settingsController.updateDataSharingConsentSettings
);
module.exports = router;
