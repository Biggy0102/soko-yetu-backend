// Routes for listing.js's three "Phase 2" modals: make an offer, request a
// callback, and report an ad. Mounted at the same "/api/listings" prefix as
// listingRoutes.js, registered right after it in app.js - Express tries
// listingRoutes.js's routes first, and since none of its paths have a segment
// after :id, a request like /api/listings/2/offers falls through cleanly to
// this router instead of colliding with anything there.

const express = require("express");
const router = express.Router();
const {
  createOffer,
  getOffersForListing,
  createCallback,
  getCallbacksForListing,
  createReport,
} = require("../controllers/engagementController");
const { requireAuth, attachUserIfPresent } = require("../middleware/auth");

// Offers - always require a logged-in buyer
router.post("/:id/offers", requireAuth, createOffer);
router.get("/:id/offers", requireAuth, getOffersForListing);

// Callbacks - guests allowed, but capture the user if they happen to be logged in
router.post("/:id/callbacks", attachUserIfPresent, createCallback);
router.get("/:id/callbacks", requireAuth, getCallbacksForListing);

// Reports - guests allowed too, same reasoning as callbacks
router.post("/:id/reports", attachUserIfPresent, createReport);

module.exports = router;
