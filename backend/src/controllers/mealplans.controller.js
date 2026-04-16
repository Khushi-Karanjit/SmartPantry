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
function scoreRecipe(recipe, pantryMap, prefs, currentTarget) {
  const ingredients = recipe.ingredients || [];
  if (!ingredients.length) return { totalScore: 0, missing: [] };

  // 1. Pantry Score (35% weight - Lowered to prioritize nutritional "non-randomness")
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

  // 2. Nutritional Fit (65% weight - The "Target-First" driver)
  const mealsPerDay = Math.max(1, prefs.mealsPerDay || 2);
  const tCal = currentTarget || (prefs.caloriesTarget || 2000) / mealsPerDay;
  const tProt = (prefs.proteinTarget || 0) / mealsPerDay;
  
  const servings = Math.max(1, recipe.servings || 1);
  const calPerServing = (recipe.calories || 0) / servings;
  const protPerServing = (recipe.protein || 0) / servings;

  let nutritionFit = 1;
  if (tCal > 0) {
    const calDiff = (calPerServing - tCal) / tCal;
    const absDiff = Math.abs(calDiff);
    
    // Strict Symmetric Penalty: ±15% is the goal window per meal
    if (absDiff > 0.15) {
       // Deep penalty for being too high OR too low
       nutritionFit -= Math.min(1.0, absDiff * 2.5); 
    } else {
       // Plateaus at high score near zero diff
       nutritionFit -= absDiff * 0.5;
    }
  }

  if (tProt > 0) {
    const protDiff = Math.abs(protPerServing - tProt) / tProt;
    nutritionFit -= Math.min(0.2, protDiff * 0.2);
  }

  // Final Score with minimal randomness to ensure repeatability (non-randomness)
  const randomness = Math.random() * 0.02; 
  const totalScore = (pantryScore * 0.35 + Math.max(0, nutritionFit) * 0.65) + randomness;

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

    // Scoring is now handled adaptively within the meal generation loop below


    const mealsPerDay = Math.max(1, Math.min(4, prefs.mealsPerDay || 2));
    const repeatLimit = Math.max(1, Math.min(7, prefs.repeatLimitWeekly || 2));
    
    let mealTypes = ["Lunch", "Dinner"];
    if (mealsPerDay === 1) mealTypes = ["Dinner"];
    else if (mealsPerDay === 3) mealTypes = ["Breakfast", "Lunch", "Dinner"];
    else if (mealsPerDay === 4) mealTypes = ["Breakfast", "Lunch", "Afternoon Snack", "Dinner"];

    const usageCount = new Map();
    const days = [];
    const totalTarget = prefs.caloriesTarget || 2000;

    for (let d = 0; d < 7; d += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);

      let daySuccess = false;
      let dayMeals = [];
      let attempts = 0;

      // Smart Retry Loop for each day (up to 3 attempts to hit ±10%)
      while (!daySuccess && attempts < 3) {
        let remainingCal = totalTarget;
        const currentUsage = new Map(usageCount);
        const dayMealsIds = new Set();
        const tempMeals = [];

        // FALLBACK: On 3rd attempt, relax prep time and filter constraints
        const availableRecipes = attempts < 2 
            ? filtered 
            : allRecipes.filter(r => r.status === 'published' && (!prefs.cuisines?.length || prefs.cuisines.some(c => r.cuisine === c || r.cuisine === 'Universal')));

        // 1. Plan Main Meals
        for (let i = 0; i < mealTypes.length; i++) {
          const mealType = mealTypes[i];
          const remainingMeals = mealTypes.length - i;
          const currentTarget = remainingCal / remainingMeals;

          const candidates = availableRecipes.map(recipe => {
            const { totalScore } = scoreRecipe(recipe, pantryMap, prefs, currentTarget);
            return { recipe, score: totalScore };
          }).sort((a, b) => b.score - a.score);

          let chosen = candidates.find((item) => {
            const id = item.recipe._id.toString();
            return !dayMealsIds.has(id) && (currentUsage.get(id) || 0) < repeatLimit;
          });

          // Tier 2: If no perfect match, ignore weekly repeatLimit but STILL enforce daily uniqueness
          if (!chosen) {
            chosen = candidates.find((item) => !dayMealsIds.has(item.recipe._id.toString()));
          }

          // Tier 3: absolute fallback
          if (!chosen) chosen = candidates[0];

          const rId = chosen.recipe._id.toString();
          currentUsage.set(rId, (currentUsage.get(rId) || 0) + 1);
          dayMealsIds.add(rId);
          
          const calPerS = (chosen.recipe.calories || 0) / Math.max(1, chosen.recipe.servings || 1);
          
          // PORTION SCALING: Calculate required servings to hit currentTarget
          let sCount = 1;
          if (calPerS > 0 && calPerS < currentTarget * 0.8) {
             sCount = Math.min(2, Math.round(currentTarget / calPerS)); 
          }

          remainingCal -= calPerS * sCount;
          tempMeals.push({ mealType, recipeId: chosen.recipe._id, servingsCount: sCount });
        }

        // 2. Back-filling
        if (remainingCal > totalTarget * 0.10) {
            const snacks = availableRecipes.filter(r => {
                const cal = (r.calories || 0) / Math.max(1, r.servings || 1);
                return cal > 50 && cal <= remainingCal * 1.5; 
            }).map(recipe => {
                const { totalScore } = scoreRecipe(recipe, pantryMap, prefs, remainingCal);
                return { recipe, score: totalScore };
            }).sort((a, b) => b.score - a.score);

            if (snacks.length) {
                const snack = snacks.find(s => !dayMealsIds.has(s.recipe._id.toString()));
                if (snack) {
                    const rId = snack.recipe._id.toString();
                    currentUsage.set(rId, (currentUsage.get(rId) || 0) + 1);
                    const calPerSSnack = (snack.recipe.calories || 0) / Math.max(1, snack.recipe.servings || 1);
                    
                    let sCountSnack = 1;
                    if (calPerSSnack < remainingCal * 0.7) {
                        sCountSnack = Math.min(2, Math.round(remainingCal / calPerSSnack));
                    }

                    remainingCal -= calPerSSnack * sCountSnack;
                    tempMeals.push({ mealType: "Side/Snack", recipeId: snack.recipe._id, servingsCount: sCountSnack });
                }
            }
        }

        const totalDayCal = totalTarget - remainingCal;
        const variance = Math.abs(totalDayCal - totalTarget) / totalTarget;

        if (variance <= 0.15 || attempts === 2) { 
          daySuccess = true;
          dayMeals = tempMeals;
          for (const [id, count] of currentUsage.entries()) usageCount.set(id, count);
        }
        attempts++;
      }

      days.push({ date, meals: dayMeals });
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
