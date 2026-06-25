// Protects routes that require a logged-in user.
// Reads the "Authorization: Bearer <token>" header, verifies it, and attaches
// the decoded user info to req.user so later route handlers know who's asking.

const { verifyToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  const token = header.slice("Bearer ".length);

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, phone }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

// Like requireAuth, but doesn't block the request if there's no token.
// Useful for routes like "request callback" that work for both guests and logged-in users.
function attachUserIfPresent(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      req.user = verifyToken(header.slice("Bearer ".length));
    } catch (err) {
      // Invalid/expired token on an optional route - just proceed as a guest.
      req.user = null;
    }
  }
  next();
}

module.exports = { requireAuth, attachUserIfPresent };
