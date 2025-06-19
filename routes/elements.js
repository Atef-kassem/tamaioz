const express = require("express");
const router = express.Router();
const elementController = require("../Controllers/elementController");

function authMiddleware(req, res, next) {
  if (
    req.user &&
    (req.user.role === "admin" ||
      req.user.role === "supervisor" ||
      req.user.role === "superadmin")
  ) {
    next();
  } else {
    res.status(403).send("Access denied");
  }
}

router.get("/", authMiddleware, elementController.getAllElements);
router.get("/page", authMiddleware, elementController.renderElementPage);
router.post("/", authMiddleware, elementController.createElement);
router.put("/:id", authMiddleware, elementController.updateElement);
router.delete("/:id", authMiddleware, elementController.deleteElement);

module.exports = router;
