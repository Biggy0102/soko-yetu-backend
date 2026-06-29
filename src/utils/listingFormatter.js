// Shared listing-shaping logic used by any controller that returns listings:
// listingController.js (browse/detail/mine), sellerController.js (seller's active
// listings), savedAdController.js (a user's saved listings). Centralized here so
// a future field change only needs to happen once.

// Fields always included when fetching a listing, so toPublicListing() has what it needs
const LISTING_INCLUDE = {
  category: true,
  subcategory: true,
  country: true,
  seller: true,
  photos: true,
};

// Strips internal fields and reshapes a listing the way the frontend expects -
// e.g. listing.js calls getSellerProfile(listing.sellerName) and reads listing.icon,
// so we surface the seller's public info and the category icon directly on the listing.
function toPublicListing(listing) {
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    negotiable: listing.negotiable,
    currency: listing.currency,
    description: listing.description,
    category: listing.categoryId,
    categoryName: listing.category?.name,
    icon: listing.category?.icon,
    sub: listing.subcategoryId,
    subName: listing.subcategory?.name,
    country: listing.countryCode,
    countryName: listing.country?.name,
    city: listing.city,
    location: `${listing.city}, ${listing.country?.name || ""}`,
    storeAddress: listing.storeAddress,
    specs: listing.specs,
    photos: (listing.photos || [])
      .sort((a, b) => a.position - b.position)
      .map((p) => p.url),
    sellerId: listing.sellerId,
    sellerName: listing.seller?.name,
    sellerPhone: listing.seller?.phone,
    seller: listing.seller
      ? {
          name: listing.seller.name,
          verified: listing.seller.verified,
          memberSince: listing.seller.memberSince,
          responseTime: listing.seller.responseTime,
        }
      : undefined,
    status: listing.status,
    featured: listing.featured,
    views: listing.views,
    postedAt: listing.createdAt,
  };
}

module.exports = { LISTING_INCLUDE, toPublicListing };
