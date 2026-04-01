const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");

const pantryController = require("../controllers/pantry.controller");

const {
  getPresets,
  initializePantry,
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  cleanupExpiredItems,
  restockPantryItem,
} = pantryController;

// CRUD
router.get("/", requireAuth, getPantryItems);
router.post("/", requireAuth, addPantryItem);
router.delete("/cleanup", requireAuth, cleanupExpiredItems); // Move cleanup before ID param to avoid conflict
router.patch("/:id", requireAuth, updatePantryItem);
router.patch("/:id/restock", requireAuth, restockPantryItem);
router.delete("/:id", requireAuth, deletePantryItem);

// Presets
router.get("/presets", requireAuth, getPresets);
router.post("/initialize", requireAuth, initializePantry);

module.exports = router;
