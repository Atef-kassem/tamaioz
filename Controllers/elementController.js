const Element = require("../models/Element");

// Get all elements in hierarchical structure
exports.getAllElements = async (req, res) => {
  try {
    const elements = await Element.find().lean();
    const map = {};
    elements.forEach((item) => {
      item.children = [];
      map[item._id] = item;
    });
    const roots = [];
    elements.forEach((item) => {
      if (item.parent) {
        map[item.parent]?.children.push(item);
      } else {
        roots.push(item);
      }
    });
    res.json(roots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new element
exports.createElement = async (req, res) => {
  try {
    const { name, type, parent, attachment, note, scale, indicator, rating } =
      req.body;
    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }
    if (!["main", "sub", "subsub"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    // Validate parent type logic
    if (type === "sub" && !parent) {
      return res
        .status(400)
        .json({ message: "Sub element must have a parent" });
    }
    if (type === "subsub" && !parent) {
      return res
        .status(400)
        .json({ message: "Subsub element must have a parent" });
    }
    const newElement = new Element({
      name,
      type,
      parent: parent || null,
      attachment: attachment || null,
      note: note || "",
      scale: scale || null,
      indicator: indicator || "",
      rating: rating || null,
    });
    await newElement.save();
    res.status(201).json(newElement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update element
exports.updateElement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await Element.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Element not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete element
exports.deleteElement = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Element.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Element not found" });
    }
    res.json({ message: "Element deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const path = require("path");

// Render element page inside dashboard layout
exports.renderElementPage = (req, res) => {
  console.log("User in renderElementPage:", req.user);
  const role = req.user ? req.user.role : null;
  console.log("User role:", role);
  // Temporarily disable role check for testing
  // if (role !== "admin" && role !== "supervisor" && role !== "superadmin") {
  //   return res.status(403).send("Access denied");
  // }

  req.app.render(
    "elementPage",
    { user: req.user, title: "إدارة العناصر" },
    (err, html) => {
      if (err) {
        console.error("Error rendering elementPage:", err);
        return res.status(500).send("Error rendering page");
      }
      res.render("dashboard", {
        title: "لوحة التحكم",
        role,
        body: html,
      });
    }
  );
};
