// Implements the real version of what listing.js's getSellerProfile() currently
// fakes with the hardcoded SELLERS lookup in data.js - real version reads the
// seller's actual account + their active listings + real feedback from the database.

const prisma = require("../prisma/client");
const { LISTING_INCLUDE, toPublicListing } = require("../utils/listingFormatter");

// ===== GET /api/sellers/:id - public seller profile =====
// Mirrors listing.js's seller card (name, verified, memberSince, responseTime,
// feedbackCount) plus the seller's own active listings, like a real "shop front"
// page would show.

async function getSellerProfile(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid seller id." });
  }

  const seller = await prisma.user.findUnique({ where: { id } });
  if (!seller) {
    return res.status(404).json({ error: "Seller not found." });
  }

  // Run the feedback aggregate and the listings fetch together - independent
  // queries, no reason to wait on one before starting the other.
  const [feedbackAgg, listings] = await Promise.all([
    prisma.feedback.aggregate({
      where: { sellerId: id },
      _count: { _all: true },
      _avg: { rating: true },
    }),
    prisma.listing.findMany({
      where: { sellerId: id, status: "active" },
      include: LISTING_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return res.json({
    seller: {
      id: seller.id,
      name: seller.name,
      verified: seller.verified,
      memberSince: seller.memberSince,
      responseTime: seller.responseTime,
      // Only expose phone if the seller's own privacy setting allows it -
      // same flag settings.js's privacy tab writes via showPhone.
      phone: seller.showPhone ? seller.phone : undefined,
      feedbackCount: feedbackAgg._count._all,
      averageRating: feedbackAgg._avg.rating || 0,
    },
    listings: listings.map(toPublicListing),
  });
}

// ===== GET /api/sellers/:id/feedback - list feedback for a seller =====
// Backs the "Feedback ... view all" link on listing.html.

async function getSellerFeedback(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid seller id." });
  }

  const seller = await prisma.user.findUnique({ where: { id } });
  if (!seller) {
    return res.status(404).json({ error: "Seller not found." });
  }

  const feedback = await prisma.feedback.findMany({
    where: { sellerId: id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json({
    feedback: feedback.map((f) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      author: f.author.name,
      createdAt: f.createdAt,
    })),
  });
}

// ===== POST /api/sellers/:id/feedback - leave feedback on a seller =====
// Backs a future "leave feedback" form. Any logged-in user can leave feedback,
// per the product decision - no purchase verification yet. One entry per
// author per seller; resubmitting updates the existing entry instead of
// stacking duplicates (see the @@unique constraint on the Feedback model).

async function submitSellerFeedback(req, res) {
  const sellerId = Number(req.params.id);
  if (!Number.isInteger(sellerId)) {
    return res.status(400).json({ error: "Invalid seller id." });
  }

  const { rating, comment } = req.body;
  const ratingNum = Number(rating);

  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "Rating must be a whole number from 1 to 5." });
  }

  if (sellerId === req.user.id) {
    return res.status(400).json({ error: "You can't leave feedback for yourself." });
  }

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller) {
    return res.status(404).json({ error: "Seller not found." });
  }

  // upsert: first feedback from this author creates a row, a second submission
  // just updates the existing one instead of violating the unique constraint.
  const feedback = await prisma.feedback.upsert({
    where: { sellerId_authorId: { sellerId, authorId: req.user.id } },
    update: { rating: ratingNum, comment: comment || null },
    create: {
      sellerId,
      authorId: req.user.id,
      rating: ratingNum,
      comment: comment || null,
    },
  });

  return res.status(201).json({ feedback });
}

module.exports = { getSellerProfile, getSellerFeedback, submitSellerFeedback };
