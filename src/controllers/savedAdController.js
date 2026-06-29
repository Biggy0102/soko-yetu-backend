// Implements the real version of the "Saved" header icon panel, which is
// currently just an empty UI shell in main.js with no real data behind it.
// Lets a logged-in user save/unsave listings and view their saved list.

const prisma = require("../prisma/client");
const { LISTING_INCLUDE, toPublicListing } = require("../utils/listingFormatter");

// ===== GET /api/saved-ads - the logged-in user's saved listings =====

async function getSavedAds(req, res) {
  const savedAds = await prisma.savedAd.findMany({
    where: { userId: req.user.id },
    include: { listing: { include: LISTING_INCLUDE } },
    orderBy: { createdAt: "desc" },
  });

  return res.json({
    savedAds: savedAds.map((s) => ({
      savedAt: s.createdAt,
      listing: toPublicListing(s.listing),
    })),
  });
}

// ===== POST /api/saved-ads/:listingId - save a listing =====

async function saveAd(req, res) {
  const listingId = Number(req.params.listingId);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return res.status(404).json({ error: "Listing not found." });
  }

  // upsert: saving an already-saved ad just returns the existing save instead
  // of erroring on the @@unique([userId, listingId]) constraint.
  const savedAd = await prisma.savedAd.upsert({
    where: { userId_listingId: { userId: req.user.id, listingId } },
    update: {},
    create: { userId: req.user.id, listingId },
  });

  return res.status(201).json({ savedAd });
}

// ===== DELETE /api/saved-ads/:listingId - unsave a listing =====

async function unsaveAd(req, res) {
  const listingId = Number(req.params.listingId);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const existing = await prisma.savedAd.findUnique({
    where: { userId_listingId: { userId: req.user.id, listingId } },
  });

  if (!existing) {
    // Already not saved - treat as success rather than erroring, since the
    // end state the caller wants ("this ad is not saved") is already true.
    return res.status(204).send();
  }

  await prisma.savedAd.delete({ where: { id: existing.id } });

  return res.status(204).send();
}

module.exports = { getSavedAds, saveAd, unsaveAd };
