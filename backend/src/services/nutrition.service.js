const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");

/**
 * Standardizes quantity to Base Units for calculation (g or ml)
 */
const normalizeQuantity = (qty, unit) => {
  if (!unit) return qty;
  const u = unit.toLowerCase();
  if (u === "kg" || u === "kilogram" || u === "kilograms") return qty * 1000;
  if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds") return qty * 453.592;
  if (u === "oz" || u === "ounce" || u === "ounces") return qty * 28.3495;
  if (u === "l" || u === "liter" || u === "liters" || u === "litre" || u === "litres") return qty * 1000;
  if (u === "tsp" || u === "teaspoon" || u === "teaspoons") return qty * 5;
  if (u === "tbsp" || u === "tablespoon" || u === "tablespoons") return qty * 15;
  if (u === "cup" || u === "cups") return qty * 240;
  if (u === "g" || u === "gram" || u === "grams") return qty;
  if (u === "ml" || u === "milliliter" || u === "milliliters" || u === "millilitre" || u === "millilitres") return qty;
  return qty;
};

/**
 * Calculates nutritional summary for a list of recipe ingredients
 */
const calculateRecipeMacros = async (recipeIngredients) => {
  let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const item of recipeIngredients) {
    if (!item.ingredientId || !mongoose.Types.ObjectId.isValid(item.ingredientId)) continue;

    const ing = await Ingredient.findById(item.ingredientId);
    if (!ing) continue;

    const qty = normalizeQuantity(item.quantity, item.unit);
    
    // Logic: In Precision 1.0, density is stored PER 1 GRAM or PER 1 UNIT.
    // If it's a mass/volume unit, normalized qty is already in grams/ml.
    const unitLower = (item.unit || "").toLowerCase();
    const isMassVolume = [
      "g", "gram", "grams", 
      "ml", "milliliter", "milliliters", "millilitre", "millilitres",
      "kg", "kilogram", "kilograms",
      "l", "liter", "liters", "litre", "litres",
      "tsp", "teaspoon", "teaspoons",
      "tbsp", "tablespoon", "tablespoons",
      "cup", "cups"
    ].includes(unitLower);

    let factor = qty; // Default for mass/volume (already in grams/ml)
    
    if (!isMassVolume) {
        if (ing.gramsPerUnit && ing.gramsPerUnit > 0) {
            factor = item.quantity * ing.gramsPerUnit;
        } else {
            factor = item.quantity;
        }
    }

    // High-Precision 4-4-9 Formula Integration
    const p = (ing.protein || 0) * factor;
    const c = (ing.carbs || 0) * factor;
    const f = (ing.fat || 0) * factor;

    total.protein += p;
    total.carbs += c;
    total.fat += f;
    
    // Derive calories: (Protein * 4) + (Carbs * 4) + (Fat * 9)
    total.calories += (p * 4) + (c * 4) + (f * 9);
  }

  // Round results
  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein * 10) / 10,
    carbs: Math.round(total.carbs * 10) / 10,
    fat: Math.round(total.fat * 10) / 10
  };
};

module.exports = { calculateRecipeMacros, normalizeQuantity };
