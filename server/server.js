require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// Import middleware
const { uploadLimiter, generalLimiter } = require("./middleware/rateLimit");

// Import route handlers
const mediaRoutes = require("./routes/media");
const uploadRoutes = require("./routes/upload");
const driveRoutes = require("./routes/drive");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Global Middleware ───────────────────────────────────────────────
// CORS — allow the frontend dev server
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Allow localhost and any vercel.app domain
      if (
        origin.startsWith("http://localhost") ||
        origin.endsWith(".vercel.app") ||
        origin === process.env.FRONTEND_URL
      ) {
        return callback(null, true);
      }
      callback(new Error("CORS not allowed from: " + origin));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-password"],
  })
);

// Parse JSON bodies (for any future endpoints that may need it)
app.use(express.json());

// Apply the general rate limiter to all requests
app.use(generalLimiter);

// ─── Routes ──────────────────────────────────────────────────────────
// Media listing & detail
app.use("/api/media", mediaRoutes);

// File uploads metadata
app.use("/api/upload", uploadLimiter, uploadRoutes);

// Drive token generation
app.use("/api/drive", driveRoutes);

// Admin operations (delete, etc.)
app.use("/api/admin", adminRoutes);


// ─── 404 Handler ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ─── Start Server ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`GMPhotos server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
