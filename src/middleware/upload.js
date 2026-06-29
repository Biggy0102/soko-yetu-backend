// Configures multer to accept image uploads for listings - validates type/size,
// then hands the file to uploadController.js as an in-memory buffer (not saved
// to disk) so it can be pushed straight to Cloudinary. Render's filesystem is
// ephemeral - anything written to local disk here would vanish on the next
// restart/redeploy/spin-down, which is exactly the bug this replaces.

const multer = require("multer");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed."));
  }
}

const upload = multer({
  storage: multer.memoryStorage(), // keeps the file in req.file(s).buffer instead of writing to disk
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per photo - matches typical phone camera output without being excessive
    files: 8, // post-ad.js's photo grid caps at a handful of images per ad
  },
});

module.exports = { upload };
