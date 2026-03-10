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
  if (prefs.diet && recipe.diet && recipe.diet !== prefs.diet) return false;
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

function scoreRecipe(recipe, pantryMap) {
  const ingredients = recipe.ingredients || [];
  if (!ingredients.length) return { score: 0, missing: [] };

  let matched = 0;
  const missing = [];

  ingredients.forEach((ing) => {
    const key = ing.ingredientId ? ing.ingredientId.toString() : "";
    if (!key) return;
    const pantry = pantryMap.get(key);
    const need = Number(ing.quantity || 1);
    const have = pantry ? Number(pantry.quantity || 0) : 0;
    if (have >= need) {
      matched += 1;
    } else {
      missing.push({
        name: ing.name,
        quantity: Math.max(0, need - have),
        unit: ing.unit || pantry?.unit || "",
        ingredientId: ing.ingredientId,
      });
    }
  });

  return { score: matched / ingredients.length, missing };
}

async function getCurrentPlan(req, res, next) {
  try {
    const weekStart = startOfWeek(new Date());
    const plan = await MealPlan.findOne({ userId: req.userId, weekStart }).lean();
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
        diet: "",
        cuisines: [],
        allergies: [],
        excludeIngredients: [],
        maxPrepMinutes: 0,
        mealsPerDay: 2,
        repeatLimitWeekly: 2,
      };

    const pantryItems = await PantryItem.find({ userId: req.userId }).lean();
    const pantryMap = buildPantryMap(pantryItems);

    const allRecipes = await Recipe.find().lean();
    const filtered = allRecipes.filter((r) => recipeMatchesPreferences(r, prefs));
    if (!filtered.length) {
      return res.status(400).json({ message: "No recipes match your preferences" });
    }

    const scored = filtered
      .map((recipe) => {
        const { score, missing } = scoreRecipe(recipe, pantryMap);
        return { recipe, score, missing };
      })
      .sort((a, b) => b.score - a.score);

    const mealsPerDay = Math.max(1, Math.min(3, prefs.mealsPerDay || 2));
    const repeatLimit = Math.max(1, Math.min(7, prefs.repeatLimitWeekly || 2));
    const mealTypes = mealsPerDay === 3 ? ["Breakfast", "Lunch", "Dinner"] : ["Lunch", "Dinner"];

    const usage = new Map();
    const days = [];

    for (let d = 0; d < 7; d += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);

      const meals = mealTypes.map((mealType) => {
        let chosen = scored.find((item) => (usage.get(item.recipe._id.toString()) || 0) < repeatLimit);
        if (!chosen) chosen = scored[0];

        const id = chosen.recipe._id.toString();
        usage.set(id, (usage.get(id) || 0) + 1);

        return { mealType, recipeId: chosen.recipe._id };
      });

      days.push({ date, meals });
    }

    const neededMap = new Map();
    const pantryTotals = buildPantryMap(pantryItems);

    for (const [recipeId, count] of usage.entries()) {
      const item = scored.find((r) => r.recipe._id.toString() === recipeId);
      if (!item) continue;
      for (const ing of item.recipe.ingredients || []) {
        const key = ing.ingredientId ? ing.ingredientId.toString() : "";
        if (!key) continue;
        const qty = Number(ing.quantity || 1) * count;
        const existing = neededMap.get(key) || {
          name: ing.name,
          quantity: 0,
          unit: ing.unit || "",
          ingredientId: ing.ingredientId,
        };
        existing.quantity += qty;
        if (!existing.unit && ing.unit) existing.unit = ing.unit;
        neededMap.set(key, existing);
      }
    }

    const missingItems = [];
    for (const [key, needed] of neededMap.entries()) {
      const pantry = pantryTotals.get(key);
      const available = pantry ? Number(pantry.quantity || 0) : 0;
      const missingQty = Math.max(0, Number(needed.quantity || 0) - available);
      if (missingQty > 0) {
        missingItems.push({
          name: needed.name,
          quantity: missingQty,
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

    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.userId, weekStart },
      { $set: { days, shoppingListId: shoppingList?._id || null } },
      { new: true, upsert: true }
    );

    res.json({ plan, shoppingList });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCurrentPlan, generatePlan };
