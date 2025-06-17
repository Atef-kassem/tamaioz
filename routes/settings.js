const express = require("express");
const router = express.Router();
const settingsController = require("../Controllers/settingsController");

router.get("/", settingsController.showSettings);

// GET route to show permissions page
router.get("/permissions", settingsController.showPermissions);

// POST route to update permissions
router.post("/permissions", settingsController.updatePermissions);

// POST route to update account info
router.post("/account", settingsController.updateAccount);

module.exports = router;
