// Moderation queue for listings created via post-ad.js. Every new listing is
// created with status "pending" (see listingController.js's createListing) and
// never appears in browseListings() until an admin approves it here.
// All routes in here require requireAuth + requireAdmin (see adminRoutes.js).

const prisma = require("../prisma/client");
const { LISTING_INCLUDE, toPublicListing } = require("../utils/listingFormatter");

// ===== GET /api/admin/listings - moderation queue =====
// Defaults to "pending" so the admin dashboard can just hit this with no query
// params and get the review queue. Pass ?status=rejected/active/sold to browse
// other buckets.

async function listListingsForModeration(req, res) {
  const { status = "pending", page = "1", pageSize = "20" } = req.query;

  if (!["pending", "active", "sold", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status filter." });
  }

  const take = Math.min(Number(pageSize) || 20, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: { status },
      include: LISTING_INCLUDE,
      orderBy: { createdAt: "asc" }, // oldest-pending-first, like a real review queue
      take,
      skip,
    }),
    prisma.listing.count({ where: { status } }),
  ]);

  return res.json({
    results: listings.map(toPublicListing),
    total,
    page: Number(page),
    pageSize: take,
  });
}

// ===== PATCH /api/admin/listings/:id/status - approve/reject/etc =====
// The one place a listing is allowed to move into "active" from "pending" -
// everything else goes through this, never through the seller-facing
// PATCH /api/listings/:id.

async function moderateListing(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const { status, reason } = req.body;
  if (!["active", "rejected"].includes(status)) {
    return res.status(400).json({
      error: "Status must be 'active' (approve) or 'rejected' (reject).",
    });
  }

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Listing not found." });
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: { status },
    include: LISTING_INCLUDE,
  });

  // Reject reasons aren't stored yet (no column for it on Listing) - logged for
  // now so there's at least a paper trail; add a moderationNote column if the
  // frontend needs to show sellers why an ad was rejected.
  if (status === "rejected" && reason) {
    console.log(`Listing ${id} rejected by admin ${req.user.id}: ${reason}`);
  }

  return res.json({ listing: toPublicListing(listing) });
}

module.exports = { listListingsForModeration, moderateListing };

