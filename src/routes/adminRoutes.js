// Moderation routes - not tied to any frontend page yet (no admin.html exists).
// Intended for a future admin dashboard, or for manual use via Postman/curl
// until one is built.

const express = require("express");
const router = express.Router();
const {
  listListingsForModeration,
  moderateListing,
} = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.use(requireAuth, requireAdmin);

router.get("/listings", listListingsForModeration);
router.patch("/listings/:id/status", moderateListing);

module.exports = router;

