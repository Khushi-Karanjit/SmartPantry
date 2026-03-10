const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth");
const {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require("../controllers/recipes.controller");

router.get("/", requireAuth, listRecipes);
router.get("/:id", requireAuth, getRecipe);
router.post("/", requireAuth, requireRole("admin"), createRecipe);
router.put("/:id", requireAuth, requireRole("admin"), updateRecipe);
router.delete("/:id", requireAuth, requireRole("admin"), deleteRecipe);

module.exports = router;
