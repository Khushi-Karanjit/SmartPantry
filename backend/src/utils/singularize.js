/**
 * singularize.js
 * Rule-based English singularizer optimized for food ingredient names.
 * Works on lowercase words; call toUpperCase() separately if needed.
 */

// Manual overrides for food-specific irregulars
const IRREGULAR = {
  // plural -> singular
  tomatoes: "tomato",
  potatoes: "potato",
  avocados: "avocado",
  mangoes: "mango",
  mangos: "mango",
  // Special 'ies' exceptions — these don't follow standard ies->y rule
  chilies: "chili",
  chillies: "chilli",
  veggies: "veggie",
  cookies: "cookie",
  birdies: "birdie",
  smoothies: "smoothie",
  brownies: "brownie",
  calories: "calorie",
  echoes: "echo",
  heroes: "hero",
  mice: "mouse",
  geese: "goose",
  teeth: "tooth",
  feet: "foot",
  lice: "louse",
  oxen: "ox",
  children: "child",
  cacti: "cactus",
  fungi: "fungus",
  nuclei: "nucleus",
  radii: "radius",
  stimuli: "stimulus",
  feta: "feta",
  quinoa: "quinoa",
  granola: "granola",
  salsa: "salsa",
  pasta: "pasta",
  couscous: "couscous",
  hummus: "hummus",
  // already singular (uncountable / invariant) — return as-is
};

// Words that do NOT change (invariant/uncountable food words)
const INVARIANT = new Set([
  "rice", "flour", "sugar", "salt", "pepper", "water", "milk", "cream",
  "butter", "oil", "vinegar", "sauce", "paste", "broth", "stock",
  "honey", "jam", "juice", "coffee", "tea", "wine", "beer", "cheese",
  "bread", "fish", "spinach", "lettuce", "kale", "broccoli", "asparagus",
  "corn", "barley", "oats", "wheat", "rye", "mustard", "ketchup",
  "mayo", "tahini", "miso", "tofu", "tempeh", "seaweed", "watercress",
  "parsley", "cilantro", "basil", "oregano", "thyme", "rosemary", "dill",
  "ginger", "turmeric", "cumin", "cinnamon", "paprika", "nutmeg",
  "cardamom", "saffron", "vanilla", "cocoa", "chocolate", "caramel",
  "maple", "molasses", "syrup", "yeast", "baking soda", "baking powder",
]);

/**
 * Singularize a lowercase food ingredient name.
 * @param {string} word - a lowercase, trimmed word/phrase
 * @returns {string} singular form
 */
function singularize(word) {
  if (!word || typeof word !== "string") return word;
  const w = word.trim().toLowerCase();

  // Invariant words — return unchanged
  if (INVARIANT.has(w)) return w;

  // Irregular overrides — exact match
  if (IRREGULAR[w]) return IRREGULAR[w];

  // Skip very short words, numbers, or words ending without 's'
  if (w.length < 3 || !w.endsWith("s")) return w;

  // Rules: most specific first
  if (w.endsWith("ies")  && w.length > 4) return w.slice(0, -3) + "y";  // berries -> berry
  if (w.endsWith("ves")  && w.length > 4) return w.slice(0, -3) + "f";  // leaves  -> leaf (simplification)
  if (w.endsWith("oes")  && w.length > 4) return w.slice(0, -2);        // tomatoes handled above, echoes->echo
  if (w.endsWith("sses") && w.length > 5) return w.slice(0, -2);        // dresses -> dress
  if (w.endsWith("ches") && w.length > 5) return w.slice(0, -2);        // peaches -> peach
  if (w.endsWith("shes") && w.length > 5) return w.slice(0, -2);        // radishes -> radish
  if (w.endsWith("xes")  && w.length > 4) return w.slice(0, -2);        // boxes -> box
  if (w.endsWith("zes")  && w.length > 4) return w.slice(0, -2);        // buzzes -> buzz
  if (w.endsWith("ses")  && w.length > 4) return w.slice(0, -1);        // buses -> bus
  if (w.endsWith("ss"))                   return w;                      // class, grass — don't strip
  if (w.endsWith("s")    && w.length > 3) return w.slice(0, -1);        // apples -> apple, eggs -> egg

  return w;
}

/**
 * Normalize an ingredient name: lowercase, trim, singularize.
 * @param {string} value
 * @returns {string}
 */
function normalizeName(value) {
  return singularize(String(value || "").trim().toLowerCase());
}

module.exports = { singularize, normalizeName };
