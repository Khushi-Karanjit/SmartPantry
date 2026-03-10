const Recipe = require("../models/Recipe");

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

module.exports = { listRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe };
