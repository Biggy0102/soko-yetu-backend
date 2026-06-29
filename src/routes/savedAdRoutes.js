// Routes for the "Saved" header icon panel - save/unsave a listing, and list
// the logged-in user's saved listings. All three require auth - there's no
// concept of an anonymous "saved ad."

const express = require("express");
const router = express.Router();
const { getSavedAds, saveAd, unsaveAd } = require("../controllers/savedAdController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getSavedAds);
router.post("/:listingId", requireAuth, saveAd);
router.delete("/:listingId", requireAuth, unsaveAd);

module.exports = router;
