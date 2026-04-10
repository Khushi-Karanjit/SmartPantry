// backend/scratch/debug-80kg.js
const { normalizeCulinaryUnit } = require("../src/utils/culinaryMapping");

function sanitizeIngredients(ingredients) {
  return ingredients.map(ing => {
    const name = (ing.name || "").toLowerCase();
    const unit = (ing.unit || "").toLowerCase();
    const qty = ing.quantity || 0;

    // RULE 1: Apply User-Preferred Culinary Mapping (100+ items)
    const normalized = normalizeCulinaryUnit(name, unit, qty);
    if (normalized.unit !== unit) {
      return { ...ing, quantity: normalized.quantity, unit: normalized.unit };
    }

    // RULE 3: Extreme Unit Guards (Safety catch)
    if (unit === "kg" && qty > 5) return { ...ing, quantity: 500, unit: "g" };
    if (unit === "cup" && qty > 10) return { ...ing, quantity: 2, unit: "cup" };

    return ing;
  });
}

const input = [{ name: "flour", quantity: 80, unit: "kg" }];
const sanitized = sanitizeIngredients(input);
console.log("Input:", input);
console.log("Sanitized:", sanitized);

const userPreferred = normalizeCulinaryUnit("flour", "kg", 80);
console.log("NormalizeOnly:", userPreferred);
