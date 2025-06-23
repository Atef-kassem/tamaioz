const mongoose = require("mongoose");
const Award = require("../models/Award");
const Criteria = require("../models/Criteria");

// Get all awards (conditions now as string)
exports.getAllAwards = async (req, res) => {
  try {
    const awards = await Award.find().lean();
    res.json(awards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new award
exports.createAward = async (req, res) => {
  try {
    const {
      name,
      date,
      number,
      phoneNumber,
      address,
      conditions,
      criteria,
      explanatoryText,
      status,
    } = req.body;

    // Handle uploaded files
    let attachments = [];
    if (
      req.files &&
      req.files.attachments &&
      req.files.attachments.length > 0
    ) {
      attachments = req.files.attachments.map(
        (file) => "/uploads/" + file.filename
      );
    }

    // Handle image file if uploaded separately
    let imagePath = "";
    if (req.files && req.files.image && req.files.image.length > 0) {
      imagePath = "/uploads/" + req.files.image[0].filename;
    }

    const newAward = new Award({
      name,
      date,
      number,
      phoneNumber: phoneNumber || "",
      address: address || "",
      conditions: conditions || "",
      criteria: criteria || [],
      explanatoryText: explanatoryText || "",
      attachments: attachments,
      image: imagePath,
      status: status || "active",
    });
    await newAward.save();
    res.status(201).json(newAward);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update award
exports.updateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No special processing needed for conditions, treat as string
    if (!updates.conditions) {
      updates.conditions = "";
    }
    if (!updates.criteria) {
      updates.criteria = [];
    }

    // Handle uploaded files - append new attachments to existing ones
    if (
      req.files &&
      req.files.attachments &&
      req.files.attachments.length > 0
    ) {
      const newAttachments = req.files.attachments.map(
        (file) => "/uploads/" + file.filename
      );
      // Fetch existing award to append attachments
      const existingAward = await Award.findById(id);
      if (existingAward) {
        updates.attachments = (existingAward.attachments || []).concat(
          newAttachments
        );
      } else {
        updates.attachments = newAttachments;
      }
    }

    // Handle image file if uploaded separately
    if (req.files && req.files.image && req.files.image.length > 0) {
      updates.image = "/uploads/" + req.files.image[0].filename;
    }

    // Ensure status is updated if provided
    if (updates.status === undefined) {
      updates.status = "active";
    }

    const updated = await Award.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Award not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// Update award
exports.updateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No special processing needed for conditions, treat as string
    if (!updates.conditions) {
      updates.conditions = "";
    }
    if (!updates.criteria) {
      updates.criteria = [];
    }

    // Handle uploaded files - append new attachments to existing ones
    if (
      req.files &&
      req.files.attachments &&
      req.files.attachments.length > 0
    ) {
      const newAttachments = req.files.attachments.map(
        (file) => "/uploads/" + file.filename
      );
      // Fetch existing award to append attachments
      const existingAward = await Award.findById(id);
      if (existingAward) {
        updates.attachments = (existingAward.attachments || []).concat(
          newAttachments
        );
      } else {
        updates.attachments = newAttachments;
      }
    }

    // Handle image file if uploaded separately
    if (req.files && req.files.image && req.files.image.length > 0) {
      updates.image = "/uploads/" + req.files.image[0].filename;
    }

    const updated = await Award.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Award not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Duplicate award by id
exports.duplicateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const award = await Award.findById(id).lean();
    if (!award) {
      return res.status(404).json({ message: "Award not found" });
    }

    // Remove _id to create new document
    const { _id, ...awardData } = award;

    const newAward = new Award(awardData);
    await newAward.save();

    res.status(201).json(newAward);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update award
exports.updateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No special processing needed for conditions, treat as string
    if (!updates.conditions) {
      updates.conditions = "";
    }
    if (!updates.criteria) {
      updates.criteria = [];
    }

    // Handle uploaded files - append new attachments to existing ones
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(
        (file) => "/uploads/" + file.filename
      );
      // Fetch existing award to append attachments
      const existingAward = await Award.findById(id);
      if (existingAward) {
        updates.attachments = (existingAward.attachments || []).concat(
          newAttachments
        );
      } else {
        updates.attachments = newAttachments;
      }
    }

    const updated = await Award.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Award not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete award
exports.deleteAward = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Award.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Award not found" });
    }
    res.json({ message: "Award deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Render award management page for supervisor role
exports.renderAwardPage = async (req, res) => {
  try {
    const role = req.user ? req.user.role : null;

    // Allow both supervisor and superadmin roles
    if (role !== "supervisor" && role !== "superadmin") {
      return res.status(403).send("Access denied");
    }

    // Fetch awards without populating conditions (now string)
    const awards = await Award.find().lean();

    // Group awards by name
    const groupedAwardsMap = new Map();
    awards.forEach((award) => {
      if (!groupedAwardsMap.has(award.name)) {
        groupedAwardsMap.set(award.name, []);
      }
      groupedAwardsMap.get(award.name).push(award);
    });
    const groupedAwards = Array.from(groupedAwardsMap.entries()).map(
      ([name, awards]) => ({ name, awards })
    );

    // Fetch all criteria to pass to view
    const criteria = await Criteria.find().lean();

    // Render awardContent.ejs to HTML
    req.app.render("awardContent", { groupedAwards, criteria }, (err, html) => {
      if (err) {
        console.error("Error rendering awardContent:", err);
        return res.status(500).send("Error rendering award content");
      }

      // Render dashboard with awardContent as body
      res.render("dashboard", {
        title: "لوحة إدارة الجوائز",
        role,
        body: html,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error rendering award page");
  }
};

// Duplicate award by id
exports.duplicateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const award = await Award.findById(id).lean();
    if (!award) {
      return res.status(404).json({ message: "Award not found" });
    }

    // Remove _id to create new document
    const { _id, ...awardData } = award;

    const newAward = new Award(awardData);
    await newAward.save();

    res.status(201).json(newAward);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get award by id
exports.getAwardById = async (req, res) => {
  try {
    const { id } = req.params;
    const award = await Award.findById(id).lean();
    if (!award) {
      return res.status(404).json({ message: "Award not found" });
    }
    res.json(award);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
