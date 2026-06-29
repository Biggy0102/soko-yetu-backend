// Handles the actual upload request - pushes each in-memory file buffer (see
// middleware/upload.js's memoryStorage) to Cloudinary and returns the resulting
// secure URLs. Replaces the old local-disk approach, which lost every uploaded
// photo on Render's next restart/redeploy/spin-down (the filesystem there is
// ephemeral - nothing written to it survives).

const cloudinary = require("../utils/cloudinary");

// Wraps Cloudinary's stream-based upload in a promise, since it normally
// takes a callback - lets us Promise.all() across all the files in one go.
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "soko-yetu-listings" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

async function uploadPhotos(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No photos were uploaded." });
  }

  try {
    const results = await Promise.all(
      req.files.map((file) => uploadBufferToCloudinary(file.buffer))
    );
    const urls = results.map((result) => result.secure_url);
    return res.status(201).json({ urls });
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return res.status(502).json({ error: "Photo upload failed. Please try again." });
  }
}

module.exports = { uploadPhotos };
