// Handles the actual upload request once multer has already saved the files
// to disk (see middleware/upload.js) - just builds the public URLs to return.

function uploadPhotos(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No photos were uploaded." });
  }

  // Build a full URL for each saved file - post-ad.js can store these and send
  // them as photoUrls when creating the listing.
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const urls = req.files.map((file) => `${baseUrl}/uploads/${file.filename}`);

  return res.status(201).json({ urls });
}

module.exports = { uploadPhotos };
