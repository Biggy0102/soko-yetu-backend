// Routes for static reference data (used to populate dropdowns/sidebars across
// every page - mirrors CATEGORIES and COUNTRIES in data.js).

const express = require("express");
const router = express.Router();
const { getCategories, getCountries } = require("../controllers/listingController");

router.get("/categories", getCategories);
router.get("/countries", getCountries);

module.exports = router;
