module.exports = function ensurePermission(permission) {
  return function (req, res, next) {
    if (
      !req.user ||
      !req.user.permissions ||
      !req.user.permissions.includes(permission)
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
