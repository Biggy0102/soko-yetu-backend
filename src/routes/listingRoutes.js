// Routes for browse.html, listing.html, post-ad.html, and dashboard.html.

const express = require("express");
const router = express.Router();
const {
  browseListings,
  getListing,
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
} = require("../controllers/listingController");
const { requireAuth } = require("../middleware/auth");

// IMPORTANT: /mine must be registered before /:id, otherwise Express tries to
// match "mine" as the :id parameter and getListing() fails on Number("mine").
router.get("/mine", requireAuth, getMyListings);

router.get("/", browseListings);
router.get("/:id", getListing);
router.post("/", requireAuth, createListing);
router.patch("/:id", requireAuth, updateListing);
router.delete("/:id", requireAuth, deleteListing);

module.exports = router;
