const express = require("express");
const router = express.Router();
const { google } = require("googleapis");

/**
 * GET /api/drive/token
 * Generates and returns a short-lived OAuth access token for the frontend
 * to use when uploading files directly to Google Drive.
 */
router.get("/token", async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(500).json({ error: "Google OAuth credentials not configured." });
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    // This will automatically fetch a new access token using the refresh token
    const token = await oAuth2Client.getAccessToken();

    if (!token || !token.token) {
      throw new Error("Failed to retrieve access token.");
    }

    res.json({
      accessToken: token.token,
      expiresIn: 3600, // Typically 1 hour
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
    });
  } catch (err) {
    console.error("Error generating drive token:", err);
    res.status(500).json({ error: "Failed to generate upload token." });
  }
});

module.exports = router;
