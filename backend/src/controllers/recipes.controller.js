const Recipe = require("../models/Recipe");
const SavedRecipe = require("../models/SavedRecipe");

async function listRecipes(req, res, next) {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 }).lean();
    res.json({ recipes });
  } catch (err) {
    next(err);
  }
}

async function getRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json({ recipe });
  } catch (err) {
    next(err);
  }
}

async function createRecipe(req, res, next) {
  try {
    const payload = req.body || {};
    if (!payload.name) return res.status(400).json({ message: "name is required" });
    const recipe = await Recipe.create(payload);
    res.status(201).json({ recipe });
  } catch (err) {
    next(err);
  }
}

async function updateRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body || {}, {
      new: true,
      runValidators: true,
    });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json({ recipe });
  } catch (err) {
    next(err);
  }
}

async function deleteRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function toggleSaveRecipe(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await SavedRecipe.findOne({ userId: req.userId, recipeId: id });
    if (existing) {
      await SavedRecipe.deleteOne({ _id: existing._id });
      return res.json({ saved: false });
    }
    await SavedRecipe.create({ userId: req.userId, recipeId: id });
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
}

async function getSavedRecipes(req, res, next) {
  try {
    const saved = await SavedRecipe.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("recipeId")
      .lean();
    // Return just the recipe objects for easier frontend consumption
    res.json({ recipes: saved.map(s => s.recipeId).filter(Boolean) });
  } catch (err) {
    next(err);
  }
}

async function suggestRecipes(req, res, next) {
  try {
    const { ingredientIds } = req.query;
    if (!ingredientIds) {
      return res.status(400).json({ message: "ingredientIds query parameter is required" });
    }

    const selectedIds = ingredientIds.split(",").filter((id) => id.length > 0);
    if (selectedIds.length === 0) {
      return res.json({ recipes: [] });
    }

    const recipes = await Recipe.find({ status: "published" }).lean();
    
    const suggested = recipes.map(recipe => {
      const recipeIngredientIds = recipe.ingredients.map(ing => ing.ingredientId?.toString());
      const matchedIngredients = selectedIds.filter(id => recipeIngredientIds.includes(id));
      
      const matchPercentage = recipe.ingredients.length > 0 
        ? Math.round((matchedIngredients.length / recipe.ingredients.length) * 100)
        : 0;

      return {
        ...recipe,
        matchPercentage,
        matchedCount: matchedIngredients.length
      };
    })
    .filter(recipe => recipe.matchedCount > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage || b.matchedCount - a.matchedCount);
    res.json({ recipes: suggested });
  } catch (err) {
    next(err);
  }
}

async function listCuisines(req, res, next) {
  try {
    const cuisines = await Recipe.distinct("cuisine", { status: "published" });
    res.json({ cuisines: cuisines.filter(Boolean).sort() });
  } catch (err) {
    next(err);
  }
}

module.exports = { 
  listRecipes, 
  getRecipe, 
  createRecipe, 
  updateRecipe, 
  deleteRecipe,
  toggleSaveRecipe,
  getSavedRecipes,
  suggestRecipes,
  listCuisines
};
