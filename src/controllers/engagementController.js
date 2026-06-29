// Implements the real versions of listing.js's three "Phase 2" modals:
// submitOffer() (make an offer), submitCallback() (request a call back), and
// submitReport() (report ad) - all three are currently fake, confirmation-only
// UI with no backend behind them.

const prisma = require("../prisma/client");

const VALID_REPORT_REASONS = ["scam", "prohibited", "duplicate", "wrong-category", "other"];

async function getListingOr404(listingId, res) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return null;
  }
  return listing;
}

// ===== OFFERS =====
// Backs listing.js's openOfferModal/submitOffer. Requires auth - an offer needs
// to be traceable to a real buyer account, unlike callbacks/reports which allow
// anonymous submissions.

// POST /api/listings/:id/offers - make an offer on a listing
async function createOffer(req, res) {
  const listingId = Number(req.params.id);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await getListingOr404(listingId, res);
  if (!listing) return;

  if (listing.sellerId === req.user.id) {
    return res.status(400).json({ error: "You can't make an offer on your own ad." });
  }

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Please enter a valid offer amount." });
  }

  const offer = await prisma.offer.create({
    data: { listingId, buyerId: req.user.id, amount },
  });

  return res.status(201).json({ offer });
}

// GET /api/listings/:id/offers - seller views offers made on their own ad
async function getOffersForListing(req, res) {
  const listingId = Number(req.params.id);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await getListingOr404(listingId, res);
  if (!listing) return;

  if (listing.sellerId !== req.user.id) {
    return res.status(403).json({ error: "You can only view offers on your own ads." });
  }

  const offers = await prisma.offer.findMany({
    where: { listingId },
    include: { buyer: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ offers });
}

// ===== CALLBACKS =====
// Backs listing.js's openCallbackModal/submitCallback. Name/phone are captured
// directly in the request body since, per the schema comment, the requester
// may not be logged in - req.user is read only if auth middleware happened to
// run, never required.

// POST /api/listings/:id/callbacks - request a callback from the seller
async function createCallback(req, res) {
  const listingId = Number(req.params.id);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await getListingOr404(listingId, res);
  if (!listing) return;

  const name = (req.body.name || "").trim();
  const phone = (req.body.phone || "").trim();
  if (!name || !phone) {
    return res.status(400).json({ error: "Please enter your name and phone number." });
  }

  const callback = await prisma.callback.create({
    data: {
      listingId,
      userId: req.user ? req.user.id : null,
      name,
      phone,
    },
  });

  return res.status(201).json({ callback });
}

// GET /api/listings/:id/callbacks - seller views callback requests on their own ad
async function getCallbacksForListing(req, res) {
  const listingId = Number(req.params.id);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await getListingOr404(listingId, res);
  if (!listing) return;

  if (listing.sellerId !== req.user.id) {
    return res.status(403).json({ error: "You can only view callback requests on your own ads." });
  }

  const callbacks = await prisma.callback.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ callbacks });
}

// ===== REPORTS =====
// Backs listing.js's openReportModal/submitReport, with the reason options from
// listing.html's radio group (scam, prohibited, duplicate, wrong-category, other).
// Like callbacks, reporting doesn't require login - filedById is optional.

// POST /api/listings/:id/reports - report a listing
async function createReport(req, res) {
  const listingId = Number(req.params.id);
  if (!Number.isInteger(listingId)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await getListingOr404(listingId, res);
  if (!listing) return;

  const { reason, details } = req.body;
  if (!VALID_REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ error: "Please choose a valid report reason." });
  }

  const report = await prisma.report.create({
    data: {
      listingId,
      filedById: req.user ? req.user.id : null,
      reason,
      details: details || null,
    },
  });

  return res.status(201).json({ report });
}

module.exports = {
  createOffer,
  getOffersForListing,
  createCallback,
  getCallbacksForListing,
  createReport,
};
