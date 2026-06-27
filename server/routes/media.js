const express = require("express");
const router = express.Router();
const Media = require("../models/Media");
const connectDB = require("../utils/db");

const { google } = require("googleapis");

const getDriveClient = () => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth: oAuth2Client });
};

/**
 * GET /api/media
 * Fetch all media metadata, sorted by newest first.
 */
router.get("/", async (req, res) => {
  try {
    await connectDB();
    const media = await Media.find().sort({ uploadDate: -1 });
    // Transform _id to id for frontend compatibility
    const formattedMedia = media.map(item => ({
      id: item._id,
      originalName: item.originalName,
      driveFileId: item.driveFileId,
      type: item.type,
      size: item.size,
      category: item.category || "eya",
      uploadDate: item.uploadDate,
    }));
    res.json(formattedMedia);
  } catch (err) {
    console.error("Error fetching media from DB:", err);
    res.status(500).json({ error: "Failed to fetch media." });
  }
});

/**
 * GET /api/media/stream/:driveFileId
 * Proxy and stream a file from Google Drive, forwarding Range headers for videos.
 */
router.get("/stream/:driveFileId", async (req, res) => {
  try {
    const driveClient = getDriveClient();
    const tokenRes = await driveClient.context._options.auth.getAccessToken();
    const token = tokenRes.token;
    
    const fileId = req.params.driveFileId;
    
    const fetchHeaders = {
      Authorization: `Bearer ${token}`
    };
    
    if (req.headers.range) {
      fetchHeaders.Range = req.headers.range;
    }

    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: fetchHeaders
    });

    res.status(driveRes.status);
    
    // Always specify accept-ranges for video scrubbing
    res.setHeader("Accept-Ranges", "bytes");

    driveRes.headers.forEach((value, key) => {
      // Don't forward encoding headers that might cause mismatch
      if (key.toLowerCase() !== "content-encoding") {
        res.setHeader(key, value);
      }
    });

    // Pipe the web stream to the Express response
    const reader = driveRes.body.getReader();
    
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };
    
    await pump();
    
  } catch (err) {
    console.error("Error streaming from Google Drive:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream media." });
    }
  }
});

/**
 * GET /api/media/:id
 * Fetch metadata for a specific media item.
 */
router.get("/:id", async (req, res) => {
  try {
    await connectDB();
    const item = await Media.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Media item not found." });
    }
    res.json({
      id: item._id,
      originalName: item.originalName,
      driveFileId: item.driveFileId,
      type: item.type,
      size: item.size,
      category: item.category || "eya",
      uploadDate: item.uploadDate,
    });
  } catch (err) {
    console.error("Error fetching media item:", err);
    res.status(500).json({ error: "Failed to fetch media item." });
  }
});

module.exports = router;
