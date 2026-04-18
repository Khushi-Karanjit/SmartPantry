const { normalizeCulinaryUnit } = require("./culinaryMapping");

/**
 * Normalizes an ingredient name for comparison
 */
function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function isExpired(item) {
  if (!item.addedAt) return false;
  
  let shelfLifeDays = 30;
  if (item.ingredientId && typeof item.ingredientId === 'object' && item.ingredientId.shelfLifeDays !== undefined) {
    shelfLifeDays = item.ingredientId.shelfLifeDays;
  } else if (item.categoryId && typeof item.categoryId === 'object' && item.categoryId.shelfLifeDays !== undefined) {
    shelfLifeDays = item.categoryId.shelfLifeDays;
  }

  const base = new Date(item.addedAt);
  const expiry = new Date(base);
  expiry.setDate(expiry.getDate() + Number(shelfLifeDays || 0));
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const expiryStr = expiry.toISOString().slice(0, 10);
  
  // Return true if today format string is past the expiry date string
  return todayStr >= expiryStr;
}

/**
 * Builds a map of pantry items for fast lookup
 * Map Key: ingredientId (string) OR normalizedName
 */
function buildPantryMap(items) {
  const map = new Map();
  items.forEach((item) => {
    if (isExpired(item)) return;

    // Priority 1: ingredientId
    const ingredientIdStr = (item.ingredientId && typeof item.ingredientId === 'object') ? item.ingredientId._id.toString() : (item.ingredientId ? item.ingredientId.toString() : "");
    const key = ingredientIdStr || normalizeName(item.name);
    if (!key) return;

    const qty = Number(item.quantity || 0);
    const existing = map.get(key) || { quantity: 0, unit: item.unit || "" };
    
    existing.quantity += Number.isFinite(qty) ? qty : 0;
    if (!existing.unit && item.unit) existing.unit = item.unit;
    
    map.set(key, existing);
  });
  return map;
}

/**
 * Compares a list of required ingredients against the pantry
 * Returns an array of missing items with required quantities
 */
function calculateMissingIngredients(neededIngredients, pantryItems) {
  const pantryMap = buildPantryMap(pantryItems);
  const missing = [];

  // Group needed ingredients by key first (in case the same recipe lists egg twice, etc)
  const neededMap = new Map();
  neededIngredients.forEach(ing => {
    const key = ing.ingredientId ? ing.ingredientId.toString() : normalizeName(ing.name);
    const existing = neededMap.get(key) || { name: ing.name, quantity: 0, unit: ing.unit || "", ingredientId: ing.ingredientId };
    existing.quantity += Number(ing.quantity || 1);
    neededMap.set(key, existing);
  });

  for (const [key, needed] of neededMap.entries()) {
    const pantry = pantryMap.get(key);
    const have = pantry ? Number(pantry.quantity || 0) : 0;
    const missingQty = Math.max(0, needed.quantity - have);

    if (missingQty > 0) {
      missing.push({
        name: needed.name,
        quantity: Number(missingQty.toFixed(2)),
        unit: needed.unit || pantry?.unit || "",
        ingredientId: needed.ingredientId,
      });
    }
  }

  return missing;
}

module.exports = {
  calculateMissingIngredients,
  normalizeName
};
