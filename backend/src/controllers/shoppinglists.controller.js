const ShoppingList = require("../models/ShoppingList");
const PantryItem = require("../models/PantryItem");
const { calculateMissingIngredients, normalizeName } = require("../utils/pantryHelper");

function startOfWeek(date) {
  const d = new Date(date || new Date());
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as week start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/shopping-list/current
 */
async function getCurrentShoppingList(req, res, next) {
  try {
    const weekStart = startOfWeek();
    const list = await ShoppingList.findOne({ userId: req.userId, weekStart }).lean();
    res.json({ shoppingList: list || null });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/shopping-list/add-recipe
 * Adds missing ingredients from a recipe to the manual part of the shopping list
 */
async function addRecipeIngredients(req, res, next) {
  try {
    const { ingredients } = req.body; // Array of { name, quantity, unit, ingredientId }
    if (!ingredients || !ingredients.length) {
      return res.status(400).json({ message: "No ingredients provided" });
    }

    const weekStart = startOfWeek();
    const pantryItems = await PantryItem.find({ userId: req.userId }).populate("ingredientId").lean();
    
    // 1. Calculate what's actually missing compared to current pantry
    const missingItems = calculateMissingIngredients(ingredients, pantryItems);

    if (!missingItems.length) {
      return res.json({ message: "All ingredients are already in your pantry!", addedCount: 0 });
    }

    // 2. Fetch existing list or create new
    let list = await ShoppingList.findOne({ userId: req.userId, weekStart });
    if (!list) {
      list = new ShoppingList({ userId: req.userId, weekStart, items: [] });
    }

    // 3. Merge new missing items into the list
    missingItems.forEach(newItem => {
      const key = newItem.ingredientId ? newItem.ingredientId.toString() : normalizeName(newItem.name);
      
      const existingIdx = list.items.findIndex(it => {
        const itKey = it.ingredientId ? it.ingredientId.toString() : normalizeName(it.name);
        return itKey === key;
      });

      if (existingIdx > -1) {
        // Increment quantity if it already exists
        list.items[existingIdx].quantity += newItem.quantity;
      } else {
        // Add as new manual item
        list.items.push({ ...newItem, source: "manual" });
      }
    });

    await list.save();
    res.json({ shoppingList: list, addedCount: missingItems.length });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/shopping-list/item/:index
 * Update item quantity or status
 */
async function updateItem(req, res, next) {
  try {
    const { index } = req.params;
    const { quantity, checked } = req.body;
    const weekStart = startOfWeek();

    const list = await ShoppingList.findOne({ userId: req.userId, weekStart });
    if (!list || !list.items[index]) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (quantity !== undefined) list.items[index].quantity = quantity;
    if (checked !== undefined) list.items[index].checked = checked;

    await list.save();
    res.json({ shoppingList: list });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/shopping-list/item/:index
 */
async function removeItem(req, res, next) {
  try {
    const { index } = req.params;
    const weekStart = startOfWeek();

    const list = await ShoppingList.findOne({ userId: req.userId, weekStart });
    if (!list) return res.status(404).json({ message: "List not found" });

    list.items.splice(index, 1);
    await list.save();
    res.json({ shoppingList: list });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/shopping-list/clear
 */
async function clearList(req, res, next) {
  try {
    const weekStart = startOfWeek();
    await ShoppingList.findOneAndDelete({ userId: req.userId, weekStart });
    res.json({ message: "Shopping list cleared" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCurrentShoppingList,
  addRecipeIngredients,
  updateItem,
  removeItem,
  clearList
};
