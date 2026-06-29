// Routes for the seller profile page (listing.js's getSellerProfile() and the
// "Feedback ... view all" link), plus leaving feedback on a seller.

const express = require("express");
const router = express.Router();
const {
  getSellerProfile,
  getSellerFeedback,
  submitSellerFeedback,
} = require("../controllers/sellerController");
const { requireAuth } = require("../middleware/auth");

// IMPORTANT: /:id/feedback must be registered before any bare /:id route in
// this router conflicts with it - same ordering concern as listingRoutes.js's
// /mine vs /:id, though here it's not actually ambiguous since Express matches
// the longer, more specific path first regardless of declaration order. Still
// listed in this order for readability: profile, then feedback list, then
// feedback submission.
router.get("/:id", getSellerProfile);
router.get("/:id/feedback", getSellerFeedback);
router.post("/:id/feedback", requireAuth, submitSellerFeedback);

module.exports = router;
