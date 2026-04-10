const CookingLog = require("../models/CookingLog");
const Recipe = require("../models/Recipe");
const PantryItem = require("../models/PantryItem");
const mongoose = require("mongoose");

/**
 * Log a meal as cooked and deduct ingredients from pantry
 */
exports.createLog = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recipeId, servings = 1 } = req.body;
    const userId = req.userId;

    if (!recipeId) {
      return res.status(400).json({ message: "recipeId is required" });
    }

    const recipe = await Recipe.findById(recipeId).lean();
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // 1. Create the Cooking Log
    const newLog = new CookingLog({
      userId,
      recipeId,
      ingredientsUsed: recipe.ingredients.map(ing => ({
        ingredientId: ing.ingredientId,
        name: ing.name,
        quantity: (ing.quantity || 0) * (servings / (recipe.servings || 1)),
        unit: ing.unit
      })),
      performedAt: new Date()
    });

    await newLog.save({ session });

    // 2. Deduct from Pantry
    for (const ing of recipe.ingredients) {
      if (!ing.ingredientId) continue;

      const neededQty = (ing.quantity || 0) * (servings / (recipe.servings || 1));
      
      // Find the pantry item for this ingredient
      const pantryItem = await PantryItem.findOne({ 
        userId, 
        ingredientId: ing.ingredientId 
      }).session(session);

      if (pantryItem) {
        // Subtract quantity, but don't go below 0
        pantryItem.quantity = Math.max(0, pantryItem.quantity - neededQty);
        await pantryItem.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ 
      message: "Meal logged successfully and ingredients deducted from pantry.",
      log: newLog 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error logging meal:", error);
    res.status(500).json({ message: "Error logging meal", error: error.message });
  }
};

/**
 * Get cooking history for the current user
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const history = await CookingLog.find({ userId })
      .sort({ performedAt: -1 })
      .populate("recipeId")
      .lean();

    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};
