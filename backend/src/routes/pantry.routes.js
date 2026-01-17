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
} = pantryController;

// CRUD
router.get("/", requireAuth, getPantryItems);
router.post("/", requireAuth, addPantryItem);
router.patch("/:id", requireAuth, updatePantryItem);
router.delete("/:id", requireAuth, deletePantryItem);

// Presets
router.get("/presets", requireAuth, getPresets);
router.post("/initialize", requireAuth, initializePantry);

module.exports = router;
