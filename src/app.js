// Main server entry point. Run with: node src/app.js (or npm run dev)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(helmet());
app.use(cors()); // tighten this to your real frontend's origin before going to production
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

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
