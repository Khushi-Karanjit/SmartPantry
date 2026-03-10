const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const {
  searchIngredients,
  createCustomIngredient,
} = require("../controllers/ingredients.controller");

router.get("/", requireAuth, searchIngredients);
router.post("/custom", requireAuth, createCustomIngredient);

module.exports = router;
