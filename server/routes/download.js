const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { readDb } = require("../utils/db");

/**
 * GET /api/download/:id
 * Streams the file to the client with a Content-Disposition: attachment header
 * so browsers trigger a download using the original filename.
 */
router.get("/:id", (req, res) => {
  try {
    const db = readDb();
    const item = db.media.find((m) => m.id === req.params.id);

    if (!item) {
      return res.status(404).json({ error: "Media not found." });
    }

    const filePath = path.join(__dirname, "..", "uploads", item.filename);

    // Make sure the file actually exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on disk." });
    }

    // Set headers so the browser downloads with the original filename
    res.setHeader("Content-Disposition", `attachment; filename="${item.originalName}"`);
    res.setHeader("Content-Type", item.mimeType);

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (streamErr) => {
      console.error("Error streaming file:", streamErr);
      // Only send error if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file." });
      }
    });
  } catch (err) {
    console.error("Error during download:", err);
    res.status(500).json({ error: "Failed to process download." });
  }
});

module.exports = router;
