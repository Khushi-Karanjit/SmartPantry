const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth");
const {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleSaveRecipe,
  getSavedRecipes,
  suggestRecipes,
  listCuisines,
  processVideo
} = require("../controllers/recipes.controller");

router.get("/", requireAuth, listRecipes);
router.get("/cuisines", requireAuth, listCuisines);
router.get("/suggested", requireAuth, suggestRecipes);
router.get("/saved", requireAuth, getSavedRecipes);
router.get("/:id", requireAuth, getRecipe);
router.post("/saved/:id", requireAuth, toggleSaveRecipe);
router.post("/process-video", requireAuth, requireRole("admin"), processVideo);
router.post("/", requireAuth, requireRole("admin"), createRecipe);
router.put("/:id", requireAuth, requireRole("admin"), updateRecipe);
router.delete("/:id", requireAuth, requireRole("admin"), deleteRecipe);

module.exports = router;
