// Single shared Prisma client instance.
// Importing this same file everywhere avoids opening a new DB connection pool
// every time a route or controller needs the database.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
