const express = require("express");
const router = express.Router();
const Media = require("../models/Media");
const connectDB = require("../utils/db");

/**
 * POST /api/upload/metadata
 * Accepts JSON metadata after the frontend has successfully uploaded the file to Google Drive.
 */
router.post("/metadata", async (req, res) => {
  try {
    await connectDB();
    const { originalName, driveFileId, type, size, category } = req.body;

    if (!originalName || !driveFileId || !type || !size) {
      return res.status(400).json({ error: "Missing required metadata fields." });
    }

    const newMedia = new Media({
      originalName,
      driveFileId,
      type,
      size,
      category: category || "eya",
    });

    const savedMedia = await newMedia.save();

    res.status(201).json({
      id: savedMedia._id,
      originalName: savedMedia.originalName,
      driveFileId: savedMedia.driveFileId,
      type: savedMedia.type,
      size: savedMedia.size,
      category: savedMedia.category,
      uploadDate: savedMedia.uploadDate,
    });
  } catch (err) {
    console.error("Error saving media metadata:", err);
    res.status(500).json({ error: "Failed to save media metadata." });
  }
});

module.exports = router;
