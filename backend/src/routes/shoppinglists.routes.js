const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { 
  getCurrentShoppingList, 
  addRecipeIngredients, 
  updateItem, 
  removeItem, 
  clearList 
} = require("../controllers/shoppinglists.controller");

router.get("/current", requireAuth, getCurrentShoppingList);
router.post("/add-recipe", requireAuth, addRecipeIngredients);
router.put("/item/:index", requireAuth, updateItem);
router.delete("/item/:index", requireAuth, removeItem);
router.delete("/clear", requireAuth, clearList);

module.exports = router;
