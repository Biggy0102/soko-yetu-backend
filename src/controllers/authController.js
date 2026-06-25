// Implements the real version of what js/auth.js currently fakes:
// handleRegister() and handleLogin() in the frontend just show an alert/modal -
// these endpoints actually create/check accounts in the database.

const bcrypt = require("bcrypt");
const prisma = require("../prisma/client");
const { signToken } = require("../utils/jwt");

const SALT_ROUNDS = 10;

// Same validation rules as js/auth.js's handleRegister(), now enforced server-side too
// (the frontend should keep its own checks for instant feedback, but the server
// must never trust the client alone).
function validateRegisterInput({ name, phone, email, password }) {
  const errors = {};

  if (!name || !name.trim()) {
    errors.name = "Please enter your full name.";
  }

  const phoneDigits = (phone || "").replace(/\D/g, "");
  if (!phone) {
    errors.phone = "Please enter your phone number.";
  } else if (phoneDigits.length < 7 || phoneDigits.length > 10) {
    errors.phone = "Enter a valid phone number (without the country code).";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address, or leave this blank.";
  }

  if (!password) {
    errors.password = "Please create a password.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

async function register(req, res) {
  const { name, phone, email, password, countryCode } = req.body;

  const errors = validateRegisterInput({ name, phone, email, password });
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const phoneDigits = phone.replace(/\D/g, "");

  // Phone and email must each be unique - check both up front for a clear error
  // message instead of letting the DB throw a generic constraint error.
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: phoneDigits },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (existing) {
    const field = existing.phone === phoneDigits ? "phone" : "email";
    return res.status(409).json({
      errors: { [field]: `An account with this ${field} already exists.` },
    });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      phone: phoneDigits,
      email: email || null,
      passwordHash,
      countryCode: countryCode || "KE",
    },
  });

  const token = signToken(user);

  return res.status(201).json({
    token,
    user: toPublicUser(user),
  });
}

async function login(req, res) {
  const { identifier, password } = req.body; // identifier = phone or email, matches loginIdentifier in the frontend

  if (!identifier || !password) {
    return res.status(400).json({
      errors: {
        ...(!identifier && { identifier: "Enter your phone number or email." }),
        ...(!password && { password: "Enter your password." }),
      },
    });
  }

  const identifierDigits = identifier.replace(/\D/g, "");
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: identifierDigits },
        { email: identifier },
      ],
    },
  });

  // Same error for "no such user" and "wrong password" - don't reveal which one
  // was wrong, since that helps attackers enumerate valid accounts.
  if (!user) {
    return res.status(401).json({ error: "Incorrect phone/email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Incorrect phone/email or password." });
  }

  const token = signToken(user);

  return res.json({
    token,
    user: toPublicUser(user),
  });
}

async function getMe(req, res) {
  // req.user is set by the requireAuth middleware after verifying the token
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user) {
    return res.status(404).json({ error: "Account not found." });
  }

  return res.json({ user: toPublicUser(user) });
}

// Strips the password hash before sending user data back to the client - never
// send passwordHash over the wire, even hashed.
function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

module.exports = { register, login, getMe };
