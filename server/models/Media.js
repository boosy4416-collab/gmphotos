const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
  },
  driveFileId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  size: {
    type: Number, // in bytes
    required: true,
  },
  category: {
    type: String,
    enum: ["eya", "nada"],
    default: "eya",
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Media", MediaSchema);
