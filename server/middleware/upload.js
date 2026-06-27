const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Allowed file extensions grouped by type
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".tiff"];
const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".wmv"];
const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];

// Dangerous executable extensions to always reject
const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".com", ".scr", ".pif", ".vbs", ".js", ".jar"];

/**
 * Multer disk storage configuration.
 * Files are saved to uploads/ with UUID-based filenames, preserving the original extension.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter — only accept images and videos; reject executables & unknown types.
 */
function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  // Block dangerous executables first
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File type "${ext}" is not allowed. Executable files are rejected.`), false);
  }

  // Only allow known image/video extensions
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`File type "${ext}" is not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`),
      false
    );
  }

  cb(null, true);
}

// Build the multer instance — no file size limit as per requirements
const upload = multer({ storage, fileFilter });

module.exports = { upload, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_VIDEO_EXTENSIONS };
