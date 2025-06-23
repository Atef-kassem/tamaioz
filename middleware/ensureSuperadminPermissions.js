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
  "delete_criteria",
  "view_criteria",
  "view_criteria_page",
  "save_criteria_methodology",
  "save_criteria_definition",
  "upload_criteria_attachment",
  "view_sidebar_awards",
  "view_sidebar_elements",
  "save_award",
];

function ensureSuperadminPermissions(req, res, next) {
  if (req.user && req.user.role === "superadmin") {
    // Assign all permissions if empty or missing
    if (!req.user.permissions || req.user.permissions.length === 0) {
      req.user.permissions = allPermissions;
    }
  }
  next();
}

module.exports = ensureSuperadminPermissions;
