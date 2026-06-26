// Route for uploading listing photos - used by post-ad.js before creating the
// listing itself (upload photos first, get back URLs, then POST /api/listings
// with those URLs in photoUrls).

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { upload } = require("../middleware/upload");
const { uploadPhotos } = require("../controllers/uploadController");
const { requireAuth } = require("../middleware/auth");

// "photos" is the field name the frontend's form-data upload must use.
// requireAuth first - no point accepting file uploads from anonymous requests.
router.post("/", requireAuth, upload.array("photos", 8), uploadPhotos);

// Multer throws its own error type (e.g. file too large, too many files) -
// catch it here and turn it into the same clean JSON shape other errors use,
// instead of letting it fall through to the generic 500 handler.
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Each photo must be 5MB or smaller." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: "You can upload up to 8 photos at a time." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    // Covers the fileFilter rejection from middleware/upload.js
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
