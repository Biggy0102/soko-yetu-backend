// Main server entry point. Run with: node src/app.js (or npm run dev)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const referenceRoutes = require("./routes/referenceRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const savedAdRoutes = require("./routes/savedAdRoutes");
const engagementRoutes = require("./routes/engagementRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const app = express();

// Render (and most PaaS providers) terminate TLS at a proxy in front of the
// app, then forward requests internally over plain HTTP. Without this,
// req.protocol always reports "http" - even when the original client request
// was https - which is why uploadController.js was building http:// URLs.
// trust proxy tells Express to read the real protocol from the
// X-Forwarded-Proto header that Render's proxy sets.
app.set("trust proxy", 1);

app.use(
  helmet({
    // Default helmet blocks other origins from loading images/files from this
    // server - since the frontend lives on a different domain (Netlify) than
    // this API (Render), that default would silently break every listing photo.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors()); // tighten this to your real frontend's origin before going to production
app.use(express.json());

// Serves uploaded photos as plain static files, e.g.
// https://soko-yetu-backend.onrender.com/uploads/abc123.jpg
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/listings", engagementRoutes); // offers/callbacks/reports - registered after listingRoutes so :id routes there match first
app.use("/api", referenceRoutes); // exposes /api/categories and /api/countries
app.use("/api/upload", uploadRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/saved-ads", savedAdRoutes);
app.use("/api/conversations", conversationRoutes);

// Catch-all error handler - keeps unexpected errors from leaking stack traces
// to the client while still logging them for us to debug.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Soko Yetu backend running on http://localhost:${PORT}`);
});
