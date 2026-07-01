ï»¿// Implements the real version of what js/browse.js, js/listing.js, js/post-ad.js,
// and js/dashboard.js currently fake using the hardcoded LISTINGS array and
// sessionStorage. These endpoints read/write real listings in the database.

const prisma = require("../prisma/client");
const { LISTING_INCLUDE, toPublicListing } = require("../utils/listingFormatter");

// ===== GET /api/listings - browse/search with filters =====
// Mirrors getFilteredListings() in browse.js: category, sub, country, q, min, max, sort.

async function browseListings(req, res) {
  const {
    category,
    sub,
    country,
    q,
    min,
    max,
    sort = "newest",
    page = "1",
    pageSize = "20",
  } = req.query;

  const where = {
    status: "active", // browse only ever shows live ads, same as the frontend's intent
  };

  if (category) where.categoryId = category;
  if (sub) where.subcategoryId = sub;
  if (country) where.countryCode = country;
  if (min || max) {
    where.price = {};
    if (min) where.price.gte = Number(min);
    if (max) where.price.lte = Number(max);
  }
  if (q) {
    // Same intent as browse.js: match title OR description, case-insensitive
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  let orderBy = { createdAt: "desc" }; // "newest" default
  if (sort === "price-low") orderBy = { price: "asc" };
  if (sort === "price-high") orderBy = { price: "desc" };

  const take = Math.min(Number(pageSize) || 20, 50); // hard cap to avoid abuse
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: LISTING_INCLUDE,
      orderBy,
      take,
      skip,
    }),
    prisma.listing.count({ where }),
  ]);

  return res.json({
    results: listings.map(toPublicListing),
    total,
    page: Number(page),
    pageSize: take,
  });
}

// ===== GET /api/listings/:id - single listing detail =====
// Mirrors listing.js's renderListing() - also bumps the view count, like a real
// marketplace would track when an ad detail page is opened.

async function getListing(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: LISTING_INCLUDE,
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found." });
  }

  // Fire-and-forget view increment - don't make the requester wait on this write
  prisma.listing
    .update({ where: { id }, data: { views: { increment: 1 } } })
    .catch((err) => console.error("Failed to increment views:", err));

  return res.json({ listing: toPublicListing(listing) });
}

// ===== GET /api/listings/mine - logged-in user's own ads =====
// Mirrors dashboard.js's getMyAds() - real version, scoped to the authenticated user
// instead of a hardcoded DEMO_USER_NAME + sessionStorage.

async function getMyListings(req, res) {
  const listings = await prisma.listing.findMany({
    where: { sellerId: req.user.id },
    include: LISTING_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  const publicListings = listings.map(toPublicListing);

  // Same stats dashboard.js's renderStats() computes client-side
  const stats = {
    total: publicListings.length,
    active: publicListings.filter((l) => l.status === "active").length,
    pending: publicListings.filter((l) => l.status === "pending").length,
    sold: publicListings.filter((l) => l.status === "sold").length,
    totalViews: publicListings.reduce((sum, l) => sum + (l.views || 0), 0),
  };

  return res.json({ listings: publicListings, stats });
}

// ===== POST /api/listings - create a new ad =====
// Mirrors post-ad.js's submitAd() - real version, persisted to the database and
// tied to the logged-in seller instead of sessionStorage.

async function createListing(req, res) {
  const {
    title,
    price,
    negotiable,
    currency,
    description,
    category,
    sub,
    countryCode,
    city,
    storeAddress,
    specs,
    photoUrls, // array of already-uploaded photo URLs (see photo upload endpoint, future work)
  } = req.body;

  // Same required-field checks as validateStep() in post-ad.js, enforced server-side too
  const errors = {};
  if (!title || !title.trim()) errors.title = "Please enter a title for your ad.";
  if (price === undefined || price === null || Number(price) < 0) {
    errors.price = "Please enter a valid price (use 0 for negotiable/free).";
  }
  if (!category) errors.category = "Please choose a category.";
  if (!countryCode) errors.countryCode = "Please choose a country.";
  if (!city || !city.trim()) errors.city = "Please enter a city.";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  // Validate category/subcategory/country actually exist, rather than trusting
  // whatever ids the client sends.
  const categoryRecord = await prisma.category.findUnique({ where: { id: category } });
  if (!categoryRecord) {
    return res.status(400).json({ errors: { category: "Unknown category." } });
  }
  if (sub) {
    const subRecord = await prisma.subcategory.findUnique({ where: { id: sub } });
    if (!subRecord || subRecord.categoryId !== category) {
      return res.status(400).json({ errors: { sub: "Unknown subcategory for this category." } });
    }
  }
  const countryRecord = await prisma.country.findUnique({ where: { code: countryCode } });
  if (!countryRecord) {
    return res.status(400).json({ errors: { countryCode: "Unknown country." } });
  }

  const listing = await prisma.listing.create({
    data: {
      title: title.trim(),
      price: Number(price),
      negotiable: Boolean(negotiable),
      currency: currency || countryRecord.currency,
      description: (description || "").trim(),
      categoryId: category,
      subcategoryId: sub || null,
      countryCode,
      city: city.trim(),
      storeAddress: storeAddress || null,
      specs: specs || {},
      sellerId: req.user.id,
      status: "pending", // same as postAdState's default - awaits moderation before going live
      photos: Array.isArray(photoUrls)
        ? { create: photoUrls.map((url, i) => ({ url, position: i })) }
        : undefined,
    },
    include: LISTING_INCLUDE,
  });

  return res.status(201).json({ listing: toPublicListing(listing) });
}

// ===== PATCH /api/listings/:id - edit own ad =====
// Mirrors dashboard.js's saveEditedAd() and markAsSold() - real version, only
// the owning seller can edit, and only session-posted ads could be edited before.

async function updateListing(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Listing not found." });
  }
  if (existing.sellerId !== req.user.id) {
    return res.status(403).json({ error: "You can only edit your own ads." });
  }

  // Only allow updating fields the frontend's edit modal actually exposes,
  // plus status (used by "Mark sold").
  const allowedFields = ["title", "price", "description", "status"];
  const data = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  }

  if (data.title !== undefined && !data.title.trim()) {
    return res.status(400).json({ error: "Title cannot be empty." });
  }
  if (data.price !== undefined && Number(data.price) < 0) {
    return res.status(400).json({ error: "Price must be 0 or greater." });
  }

  // Sellers may only toggle between "active" and "sold" on their own ad (the
  // "Mark as sold" / "Relist" actions). They can never set "active" from
  // "pending"/"rejected" themselves - that would let anyone skip moderation
  // entirely. Only the admin endpoints (adminController.js) can do that.
  if (data.status !== undefined) {
    const allowedSelfTransitions = { active: "sold", sold: "active" };
    if (allowedSelfTransitions[existing.status] !== data.status) {
      return res.status(403).json({
        error: "You can only mark an active ad as sold, or relist a sold ad.",
      });
    }
  }

  const listing = await prisma.listing.update({
    where: { id },
    data,
    include: LISTING_INCLUDE,
  });

  return res.json({ listing: toPublicListing(listing) });
}

// ===== DELETE /api/listings/:id - delete own ad =====
// Mirrors dashboard.js's confirmDeleteAd().

async function deleteListing(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Listing not found." });
  }
  if (existing.sellerId !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own ads." });
  }

  await prisma.listing.delete({ where: { id } });

  return res.status(204).send();
}

// ===== GET /api/categories =====
// Mirrors the CATEGORIES array in data.js.

async function getCategories(req, res) {
  const categories = await prisma.category.findMany({
    include: { subcategories: true },
    orderBy: { id: "asc" },
  });
  return res.json({ categories });
}

// ===== GET /api/countries =====
// Mirrors the COUNTRIES array in data.js.

async function getCountries(req, res) {
  const countries = await prisma.country.findMany({ orderBy: { name: "asc" } });
  return res.json({ countries });
}

module.exports = {
  browseListings,
  getListing,
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  getCategories,
  getCountries,
};

