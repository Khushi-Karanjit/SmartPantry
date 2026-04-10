/**
 * backend/src/utils/culinaryMapping.js
 * Comprehensive ingredient-to-unit mapping provided by the user.
 */

const UNIT_MAPPING = {
  // Dairy & Liquid Base
  "water": "ml",
  "milk": "ml",
  "butter": "gram",
  "cheese": "gram",
  "cream": "scoop",
  "cream cheese": "gram",
  "yogurt": "ml",
  "egg": "pcs",
  "egg white": "pcs",
  "egg yolk": "pcs",
  "buttermilk": "ml",
  "condensed milk": "ml",

  // Flour & Grains
  "flour": "gram",
  "whole wheat flour": "gram",
  "corn flour": "gram",
  "rice flour": "gram",
  "bread crumbs": "gram",
  "oats": "gram",
  "rice": "gram",
  "basmati rice": "gram",
  "noodles": "gram",
  "pasta": "gram",
  "spaghetti": "gram",
  "macaroni": "gram",

  // Sugars & Syrups
  "sugar": "gram",
  "brown sugar": "gram",
  "powdered sugar": "gram",
  "honey": "gram",
  "maple syrup": "ml",
  "jam": "gram",
  "jelly": "gram",

  // Spices & Powders
  "salt": "gram",
  "black pepper": "gram",
  "turmeric": "gram",
  "cumin": "gram",
  "coriander powder": "gram",
  "chili powder": "gram",
  "garam masala": "gram",
  "paprika": "gram",
  "baking powder": "gram",
  "baking soda": "gram",
  "yeast": "gram",
  "cocoa powder": "gram",
  "coffee": "gram",
  "tea leaves": "gram",
  "green tea": "gram",

  // Oils
  "olive oil": "ml",
  "vegetable oil": "ml",
  "sunflower oil": "ml",
  "coconut oil": "ml",

  // Vegetables & Aromatics
  "onion": "pcs",
  "garlic": "cloves",
  "ginger": "gram",
  "tomato": "pcs",
  "potato": "pcs",
  "carrot": "pcs",
  "cabbage": "gram",
  "spinach": "gram",
  "broccoli": "gram",
  "cauliflower": "gram",
  "peas": "gram",
  "corn": "gram",
  "eggplant": "pcs",
  "zucchini": "pcs",
  "pumpkin": "gram",
  "sweet potato": "pcs",

  // Meat & Proteins
  "chicken": "gram",
  "beef": "gram",
  "pork": "gram",
  "fish": "gram",
  "shrimp": "gram",
  "sausage": "pcs",
  "bacon": "strips",
  "paneer": "gram",
  "tofu": "gram",

  // Bakery & Breads
  "bread": "pcs",
  "bun": "pcs",
  "pizza base": "pcs",

  // Fruits
  "apple": "pcs",
  "banana": "pcs",
  "orange": "pcs",
  "lemon": "pcs",
  "lime": "pcs",
  "mango": "pcs",
  "grapes": "gram",
  "strawberry": "gram",
  "coconut": "pcs",
  "dates": "gram",
  "raisins": "gram",

  // Nuts & Seeds
  "almonds": "gram",
  "cashews": "gram",
  "walnuts": "gram",
  "peanuts": "gram",
  "flax seeds": "gram",
  "chia seeds": "gram",

  // Sauces & Condiments
  "soy sauce": "ml",
  "vinegar": "ml",
  "ketchup": "ml",
  "mayonnaise": "gram",
  "mustard sauce": "gram",
  "pickles": "gram",

  // Misc
  "chocolate": "gram",
  "vanilla extract": "ml",
  "ice cream": "scoop",
  "whipped cream": "gram",
  "beans": "gram",
  "lentils": "gram",
  "chickpeas": "gram",
  "protein powder": "gram",
  "herbs": "gram",
  "parsley": "gram",
  "cilantro": "gram",
  "mint": "gram"
};

/**
 * Normalizes an ingredient unit based on user-provided rules.
 * @param {string} name - The ingredient name.
 * @param {string} unit - Current unit.
 * @param {number} quantity - Current quantity.
 * @returns {object} { unit, quantity }
 */
function normalizeCulinaryUnit(name, unit, quantity) {
  const lowerName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const lowerUnit = (unit || "").toLowerCase();
  
  // 1. Extreme Unit Guards (Universal Safety Layer)
  // If we see >5kg or >10 cups, it's almost certainly an AI hallucination.
  if ((lowerUnit === "kg" || (lowerUnit === "gram" && quantity > 5000)) && quantity > 5) {
     return { unit: "gram", quantity: 500 }; // Correcting to a sane 500g
  }
  if (lowerUnit === "cup" && quantity > 10) {
     return { unit: "cup", quantity: 2 }; // Correcting to a sane 2 cups
  }

  // 2. Find match by stripping spaces/chars for comparison
  const match = Object.keys(UNIT_MAPPING).find(k => {
    const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    return lowerName === cleanK || lowerName.includes(cleanK) || cleanK.includes(lowerName);
  });
  
  if (match) {
    const targetUnit = UNIT_MAPPING[match];
    
    // CASE 1: AI says "pcs" or empty but user wants a measured unit
    if (lowerUnit === "pcs" || !lowerUnit) {
      let normalizedQty = quantity;
      if (targetUnit === "ml" && quantity <= 5) normalizedQty *= 250; 
      if (targetUnit === "gram" && quantity <= 10) normalizedQty *= 150; 
      return { unit: targetUnit, quantity: normalizedQty };
    }

    // CASE 2: Strict Unit Enforcement (Even if for KG or others)
    // If the mapping says "gram" but we have "kg", and it's NOT an "extreme" case handled above.
    if (targetUnit === "gram" && lowerUnit === "kg") {
       return { unit: "gram", quantity: quantity * 1000 };
    }

    // Always prioritize the target mapping unit if they aren't compatible
    const compatibleUnits = ["g", "gram", "ml", "milliliter"];
    const isCompatible = compatibleUnits.includes(lowerUnit) && compatibleUnits.includes(targetUnit);
    if (!isCompatible && lowerUnit !== targetUnit) {
       return { unit: targetUnit, quantity: quantity };
    }
  }

  return { unit, quantity };
}

module.exports = {
  UNIT_MAPPING,
  normalizeCulinaryUnit
};
