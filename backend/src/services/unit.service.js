
/**
 * backend/src/services/unit.service.js
 * Centralized service for unit normalization and SI conversions.
 */

const SI_UNITS = ['g', 'kg', 'ml', 'l', 'pcs'];

/**
 * Normalizes a quantity and unit to the base SI unit (g or ml).
 * @param {number} quantity 
 * @param {string} unit 
 * @param {string} category - Used to decide between g and ml for volume units.
 * @returns {Object} { quantity, unit }
 */
function normalizeToSi(quantity, unit, category = 'Other') {
  const qty = Number(quantity) || 0;
  const u = (unit || '').toLowerCase().trim();
  const cat = (category || 'Other').toLowerCase();

  // 1. Direct SI hits
  if (u === 'g') return { quantity: qty, unit: 'g' };
  if (u === 'ml') return { quantity: qty, unit: 'ml' };
  if (u === 'pcs') return { quantity: qty, unit: 'pcs' };

  // 2. Standard SI Scaling
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') {
    return { quantity: qty * 1000, unit: 'g' };
  }
  if (u === 'l' || u === 'liter' || u === 'liters' || u === 'litre' || u === 'litres') {
    return { quantity: qty * 1000, unit: 'ml' };
  }

  // 3. Common Culinary Volume Units (mapping to g or ml based on category)
  // Liquids: ml, Solids: g
  const isLiquid = ['dairy', 'oils', 'condiments', 'seafood'].includes(cat) || 
                   ['soy sauce', 'vinegar', 'water', 'milk', 'oil'].some(k => cat.includes(k));
  
  const targetSi = isLiquid ? 'ml' : 'g';

  // Tablespoon (15ml / 15g approx)
  if (['tbsp', 'tablespoon', 'tablespoons'].includes(u)) {
    return { quantity: qty * 15, unit: targetSi };
  }
  // Teaspoon (5ml / 5g approx)
  if (['tsp', 'teaspoon', 'teaspoons'].includes(u)) {
    return { quantity: qty * 5, unit: targetSi };
  }
  // Cup (240ml / 240g approx)
  if (['cup', 'cups'].includes(u)) {
    return { quantity: qty * 240, unit: targetSi };
  }
  // Ounce/Oz (approx 28g / 30ml)
  if (['oz', 'ounce', 'ounces'].includes(u)) {
    return { quantity: isLiquid ? qty * 30 : qty * 28, unit: targetSi };
  }
  // Pound (approx 454g)
  if (['lb', 'lbs', 'pound', 'pounds'].includes(u)) {
    return { quantity: qty * 453.59, unit: 'g' };
  }

  // 4. Default Fallback
  // For units like 'packet', 'jar', 'can' - we assume they were meant to be 'pcs' or 
  // scaled weights, but since we are migrating, we treat unhandled as 'pcs' or the qty itself.
  return { quantity: qty, unit: SI_UNITS.includes(u) ? u : 'pcs' };
}

/**
 * Standardizes a recipe ingredient quantity relative to a pantry item's unit.
 * Used for precise deduction.
 */
function standardizeForDeduction(recipeQty, recipeUnit, pantryUnit, ingredientCategory) {
  const recipeSi = normalizeToSi(recipeQty, recipeUnit, ingredientCategory);
  const pantrySi = normalizeToSi(1, pantryUnit, ingredientCategory); // Get base unit

  // If pantry is in kg and recipe is in g, convert recipe g to kg
  if (pantryUnit === 'kg' && recipeSi.unit === 'g') {
    return recipeSi.quantity / 1000;
  }
  // If pantry is in l and recipe is in ml, convert recipe ml to l
  if (pantryUnit === 'l' && recipeSi.unit === 'ml') {
    return recipeSi.quantity / 1000;
  }

  // If units match after base SI normalization (e.g. both g), return the Si quantity
  if (recipeSi.unit === pantrySi.unit) {
    return recipeSi.quantity;
  }

  // Fallback: If pantry is grams but recipe is still pieces (or vice versa), 
  // we can't easily convert without density, so return the raw quantity as a last resort.
  return recipeQty;
}

module.exports = {
  normalizeToSi,
  standardizeForDeduction,
  SI_UNITS
};
