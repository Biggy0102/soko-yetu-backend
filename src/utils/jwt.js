// Helpers for creating and reading the JWT tokens issued at login/register.

const jwt = require("jsonwebtoken");

function signToken(user) {
  // Keep the payload small - just enough to identify the user on later requests.
  return jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function verifyToken(token) {
  // Throws if invalid/expired - callers should wrap this in try/catch.
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
