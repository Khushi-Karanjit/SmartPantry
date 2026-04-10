const MealPlan = require("../models/MealPlan");
const Recipe = require("../models/Recipe");
const PantryItem = require("../models/PantryItem");
const UserPreference = require("../models/UserPreference");
const ShoppingList = require("../models/ShoppingList");

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as week start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function buildPantryMap(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = item.ingredientId ? item.ingredientId.toString() : "";
    if (!key) return;
    const current = map.get(key) || { quantity: 0, unit: item.unit || "" };
    const qty = Number(item.quantity || 0);
    current.quantity += Number.isFinite(qty) ? qty : 0;
    if (!current.unit && item.unit) current.unit = item.unit;
    map.set(key, current);
  });
  return map;
}

function recipeMatchesPreferences(recipe, prefs) {
  if (prefs.diet && recipe.diet && !recipe.diet.toLowerCase().includes(prefs.diet.toLowerCase())) return false;
  if (prefs.cuisines?.length && recipe.cuisine && !prefs.cuisines.includes(recipe.cuisine)) return false;
  if (prefs.maxPrepMinutes && recipe.prepMinutes > prefs.maxPrepMinutes) return false;

  const excluded = new Set(
    [...(prefs.allergies || []), ...(prefs.excludeIngredients || [])].map(normalizeName)
  );
  if (excluded.size) {
    for (const ing of recipe.ingredients || []) {
      if (excluded.has(normalizeName(ing.name))) return false;
    }
  }
  return true;
}

/**
 * Enhanced Scoring System
 * - Pantry Score (0.0 to 1.0)
 * - Nutritional Fit (0.0 to 1.0)
 */
function scoreRecipe(recipe, pantryMap, prefs) {
  const ingredients = recipe.ingredients || [];
  if (!ingredients.length) return { totalScore: 0, missing: [] };

  // 1. Pantry Score (70% weight)
  let matched = 0;
  const missing = [];
  ingredients.forEach((ing) => {
    const key = ing.ingredientId ? ing.ingredientId.toString() : "";
    if (!key) return;
    const pantry = pantryMap.get(key);
    const need = Number(ing.quantity || 1);
    const have = pantry ? Number(pantry.quantity || 0) : 0;
    if (have >= need) matched += 1;
    else {
      missing.push({
        name: ing.name,
        quantity: Math.max(0, need - have),
        unit: ing.unit || pantry?.unit || "",
        ingredientId: ing.ingredientId,
      });
    }
  });
  const pantryScore = matched / ingredients.length;

  // 2. Nutritional Fit (30% weight)
  // Target per meal = Target / (MealsPerDay)
  const mealsPerDay = prefs.mealsPerDay || 2;
  const tCal = (prefs.caloriesTarget || 2000) / mealsPerDay;
  const tProt = (prefs.proteinTarget || 0) / mealsPerDay;
  
  let nutritionFit = 1;
  if (tCal > 0) {
    const calDiff = Math.abs(recipe.calories - tCal) / tCal;
    nutritionFit -= Math.min(0.5, calDiff * 0.5);
  }
  if (tProt > 0) {
    const protDiff = Math.abs(recipe.protein - tProt) / tProt;
    nutritionFit -= Math.min(0.5, protDiff * 0.5);
  }

  // Final Score with slight randomness for variety
  const randomness = Math.random() * 0.1;
  const totalScore = (pantryScore * 0.7 + Math.max(0, nutritionFit) * 0.3) + randomness;

  return { totalScore, missing };
}

async function getCurrentPlan(req, res, next) {
  try {
    const weekStart = startOfWeek(new Date());
    const plan = await MealPlan.findOne({ userId: req.userId, weekStart })
      .populate("days.meals.recipeId")
      .lean();
      
    if (!plan) return res.json({ plan: null, shoppingList: null });

    const shoppingList = plan.shoppingListId
      ? await ShoppingList.findById(plan.shoppingListId).lean()
      : null;

    res.json({ plan, shoppingList });
  } catch (err) {
    next(err);
  }
}

async function generatePlan(req, res, next) {
  try {
    const weekStart = startOfWeek(new Date());

    const prefs =
      (await UserPreference.findOne({ userId: req.userId }).lean()) || {
        mealsPerDay: 2,
        repeatLimitWeekly: 2,
        caloriesTarget: 2000,
      };

    const pantryItems = await PantryItem.find({ userId: req.userId }).lean();
    const pantryMap = buildPantryMap(pantryItems);

    const allRecipes = await Recipe.find({ status: "published" }).lean();
    const filtered = allRecipes.filter((r) => recipeMatchesPreferences(r, prefs));

    if (!filtered.length) {
      return res.status(400).json({ message: "No recipes match your preferences. Try adjusting your diet or prep time." });
    }

    // Score all available recipes
    const candidateRecipes = filtered.map((recipe) => {
      const { totalScore, missing } = scoreRecipe(recipe, pantryMap, prefs);
      return { recipe, score: totalScore, missing };
    }).sort((a, b) => b.score - a.score);

    const mealsPerDay = Math.max(1, Math.min(3, prefs.mealsPerDay || 2));
    const repeatLimit = Math.max(1, Math.min(7, prefs.repeatLimitWeekly || 2));
    const mealTypes = mealsPerDay === 3 ? ["Breakfast", "Lunch", "Dinner"] : ["Lunch", "Dinner"];

    const usageCount = new Map();
    const days = [];

    for (let d = 0; d < 7; d += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);

      const dayMealsIds = new Set(); // Prevent same recipe twice in one day
      const meals = mealTypes.map((mealType) => {
        // Find best candidate not already used today and within weekly limit
        let chosen = candidateRecipes.find((item) => {
          const id = item.recipe._id.toString();
          return !dayMealsIds.has(id) && (usageCount.get(id) || 0) < repeatLimit;
        });

        // Fallback if everyone is used up
        if (!chosen) chosen = candidateRecipes[0];

        const recipeId = chosen.recipe._id.toString();
        usageCount.set(recipeId, (usageCount.get(recipeId) || 0) + 1);
        dayMealsIds.add(recipeId);

        return { mealType, recipeId: chosen.recipe._id };
      });

      days.push({ date, meals });
    }

    // Recalculate Global Shopping List
    const neededMap = new Map();
    for (const d of days) {
      for (const m of d.meals) {
        const recipe = allRecipes.find(r => r._id.toString() === m.recipeId.toString());
        if (!recipe) continue;
        for (const ing of recipe.ingredients || []) {
          const key = ing.ingredientId ? ing.ingredientId.toString() : normalizeName(ing.name);
          if (!key) continue;
          const qty = Number(ing.quantity || 1);
          const existing = neededMap.get(key) || { name: ing.name, quantity: 0, unit: ing.unit || "", ingredientId: ing.ingredientId };
          existing.quantity += qty;
          neededMap.set(key, existing);
        }
      }
    }

    const missingItems = [];
    const pantryTotals = buildPantryMap(pantryItems);
    for (const [key, needed] of neededMap.entries()) {
      const pantry = pantryTotals.get(key);
      const available = pantry ? Number(pantry.quantity || 0) : 0;
      const missingQty = Math.max(0, Number(needed.quantity || 0) - available);
      if (missingQty > 0) {
        missingItems.push({
          name: needed.name,
          quantity: Number(missingQty.toFixed(2)),
          unit: needed.unit || pantry?.unit || "",
          ingredientId: needed.ingredientId,
        });
      }
    }

    let shoppingList = null;
    if (missingItems.length) {
      shoppingList = await ShoppingList.findOneAndUpdate(
        { userId: req.userId, weekStart },
        { $set: { items: missingItems, source: "meal-plan" } },
        { new: true, upsert: true }
      );
    } else {
      await ShoppingList.findOneAndDelete({ userId: req.userId, weekStart });
    }

    let plan = await MealPlan.findOneAndUpdate(
      { userId: req.userId, weekStart },
      { $set: { days, shoppingListId: shoppingList?._id || null } },
      { new: true, upsert: true }
    );
    
    // Final populate for the response
    plan = await MealPlan.findById(plan._id).populate("days.meals.recipeId").lean();

    res.json({ plan, shoppingList });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCurrentPlan, generatePlan };
