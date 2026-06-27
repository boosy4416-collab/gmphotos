const express = require("express");
const router = express.Router();
const Media = require("../models/Media");
const connectDB = require("../utils/db");

// Simple middleware to check admin password via header
function requireAdmin(req, res, next) {
  const password = req.headers["x-admin-password"];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized. Invalid admin password." });
  }
  next();
}

/**
 * DELETE /api/admin/media/:id
 * Removes a media item from the database.
 */
router.delete("/media/:id", requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const item = await Media.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Media item not found." });
    }
    // We only delete from DB. In a full system, you might want to also delete from Google Drive.
    // For now, metadata deletion is sufficient for the gallery.
    res.json({ message: "Media deleted successfully." });
  } catch (err) {
    console.error("Error deleting media item:", err);
    res.status(500).json({ error: "Failed to delete media item." });
  }
});

module.exports = router;
