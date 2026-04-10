const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");
const Recipe = require("../models/Recipe");

const recipesToSync = [
  // ── Existing Indian & Fusion ──────────────────
  {
    name: "Creamy Butter Chicken",
    description: "Authentic, rich, and creamy Indian butter chicken with tender marinated thighs.",
    cuisine: "Indian", diet: "High Protein", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=AFdgqJkAzGc",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
    prepMinutes: 45, calories: 620, protein: 42, carbs: 12, fat: 38, servings: 4,
    ingredients: [
      { name: "chicken thighs", quantity: 1, unit: "lb" },
      { name: "tomato puree", quantity: 1, unit: "cup" },
      { name: "heavy cream", quantity: 0.5, unit: "cup" },
      { name: "butter", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Marinate chicken; sear; add tomato sauce and cream.", startTime: 30 }]
  },
  {
    name: "Easy Red Lentil Dal",
    description: "A nutritious and comforting vegan dal with a fragrant spiced oil tempering (Tarka).",
    cuisine: "Indian", diet: "Vegan", mealType: "lunch",
    videoUrl: "https://www.youtube.com/watch?v=NKTsXPLNsmo",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
    prepMinutes: 15, calories: 300, protein: 18, carbs: 45, fat: 5, servings: 4,
    ingredients: [{ name: "red lentils", quantity: 1, unit: "cup" }, { name: "turmeric", quantity: 1, unit: "tsp" }],
    steps: [{ text: "Boil lentils; add spiced tarka oil.", startTime: 20 }]
  },
  {
    name: "Chicken Tikka Masala",
    description: "Hearty and aromatic chicken tikka masala with a rich spiced tomato gravy.",
    cuisine: "Indian", diet: "High Protein", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=vV_pP60_vXY",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
    prepMinutes: 40, calories: 600, protein: 42, carbs: 18, fat: 35, servings: 4,
    ingredients: [{ name: "chicken breast", quantity: 1, unit: "lb" }, { name: "tikka masala spices", quantity: 2, unit: "tbsp" }],
    steps: [{ text: "Grill chicken; simmer in tomato cream sauce.", startTime: 40 }]
  },
  {
    name: "Vegetable Biryani",
    description: "Layered and fragrant basmati rice cooked with mixed vegetables and aromatic spices.",
    cuisine: "Indian", diet: "Vegetarian", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=1uN3BvYisCc",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=800",
    prepMinutes: 50, calories: 450, protein: 12, carbs: 75, fat: 10, servings: 4,
    ingredients: [{ name: "basmati rice", quantity: 2, unit: "cups" }, { name: "mixed vegetables", quantity: 2, unit: "cups" }],
    steps: [{ text: "Layer rice and spiced veggies; steam for 15 mins.", startTime: 60 }]
  },
  {
    name: "Slow Cooker Lamb Curry",
    description: "Tender, fall-off-the-bone lamb curry made easy in the slow cooker.",
    cuisine: "Indian Fusion", diet: "High Protein", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=8q2S4FfT17s",
    imageUrl: "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800",
    prepMinutes: 20, calories: 550, protein: 38, carbs: 12, fat: 35, servings: 6,
    ingredients: [{ name: "lamb shoulder", quantity: 2, unit: "lb" }, { name: "curry paste", quantity: 0.5, unit: "cup" }],
    steps: [{ text: "Slow cook lamb with paste and water for 8 hours.", startTime: 10 }]
  },
  {
    name: "Saag Paneer",
    description: "Rich spinach curry with cubes of fried paneer cheese.",
    cuisine: "Indian", diet: "Vegetarian", mealType: "lunch",
    videoUrl: "https://www.youtube.com/watch?v=2W-vEis0_8A",
    imageUrl: "https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800",
    prepMinutes: 30, calories: 400, protein: 20, carbs: 10, fat: 30, servings: 4,
    ingredients: [{ name: "spinach", quantity: 1, unit: "lb" }, { name: "paneer", quantity: 200, unit: "g" }],
    steps: [{ text: "Blanch spinach; blend; sauté with paneer and spices.", startTime: 30 }]
  },

  // ── 12 NEW REAL RECIPES ──────────────────
  {
    name: "Moong Dal Chilla (Savory Crepes)",
    description: "Nutritious and high-protein Indian breakfast crepes made from yellow lentils.",
    cuisine: "Indian", diet: "Vegan / High Protein", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800",
    prepMinutes: 15, calories: 220, protein: 12, carbs: 35, fat: 4, servings: 2,
    ingredients: [
      { name: "yellow moong dal", quantity: 1, unit: "cup" },
      { name: "spinach", quantity: 0.5, unit: "cup" },
      { name: "green chili", quantity: 1, unit: "pcs" },
      { name: "ginger", quantity: 1, unit: "inch" }
    ],
    steps: [{ text: "Grind soaked dal with ginger; spread on griddle; cook until crisp.", startTime: 20 }]
  },
  {
    name: "Egg Drop Soup with Greens",
    description: "Light and silky Chinese breakfast soup with protein-packed eggs and fresh spinach.",
    cuisine: "Chinese", diet: "Low Carb", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    prepMinutes: 10, calories: 150, protein: 10, carbs: 5, fat: 8, servings: 2,
    ingredients: [
      { name: "eggs", quantity: 2, unit: "pcs" },
      { name: "chicken broth", quantity: 2, unit: "cups" },
      { name: "spinach", quantity: 1, unit: "cup" },
      { name: "soy sauce", quantity: 1, unit: "tsp" }
    ],
    steps: [{ text: "Boil broth; swirl in beaten eggs; add spinach until wilted.", startTime: 15 }]
  },
  {
    name: "Spinach & Tomato Frittata",
    description: "Classic Italian baked egg dish with vibrant vegetables and light parmesan.",
    cuisine: "Italian", diet: "Vegetarian", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1510693222259-55581898c1af?w=800",
    prepMinutes: 10, calories: 240, protein: 18, carbs: 6, fat: 16, servings: 2,
    ingredients: [
      { name: "eggs", quantity: 4, unit: "pcs" },
      { name: "cherry tomatoes", quantity: 0.5, unit: "cup" },
      { name: "spinach", quantity: 1, unit: "cup" },
      { name: "parmesan", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Whisk eggs; sauté veggies; pour eggs and bake until set.", startTime: 25 }]
  },
  {
    name: "Healthy Huevos Rancheros",
    description: "A balanced Mexican breakfast with corn tortillas, black beans, and a sunny egg.",
    cuisine: "Mexican", diet: "High Fiber", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1593584785033-9c7604d0863f?w=800",
    prepMinutes: 15, calories: 350, protein: 15, carbs: 45, fat: 12, servings: 1,
    ingredients: [
      { name: "corn tortilla", quantity: 2, unit: "pcs" },
      { name: "eggs", quantity: 1, unit: "pcs" },
      { name: "black beans", quantity: 0.5, unit: "cup" },
      { name: "salsa", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Toast tortillas; top with warm beans, fried egg, and salsa.", startTime: 20 }]
  },
  {
    name: "Bhindi Masala (Spiced Okra)",
    description: "Flavorful and fiber-rich Indian okra stir-fry with onions and aromatic spices.",
    cuisine: "Indian", diet: "Vegan", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
    prepMinutes: 15, calories: 180, protein: 4, carbs: 20, fat: 10, servings: 2,
    ingredients: [
      { name: "okra", quantity: 1, unit: "lb" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "turmeric", quantity: 1, unit: "tsp" },
      { name: "cumin seeds", quantity: 1, unit: "tsp" }
    ],
    steps: [{ text: "Sauté cumin and onions; add okra and spices; cook until tender.", startTime: 25 }]
  },
  {
    name: "Tofu & Broccoli Stir-Fry",
    description: "Quick and healthy Chinese lunch with ginger-soy glazed tofu and crisp broccoli.",
    cuisine: "Chinese", diet: "Vegan", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
    prepMinutes: 10, calories: 320, protein: 22, carbs: 15, fat: 18, servings: 2,
    ingredients: [
      { name: "tofu", quantity: 1, unit: "block" },
      { name: "broccoli", quantity: 2, unit: "cups" },
      { name: "soy sauce", quantity: 2, unit: "tbsp" },
      { name: "ginger", quantity: 1, unit: "tbsp" }
    ],
    steps: [{ text: "Press tofu; sear in wok; add broccoli and ginger-soy sauce.", startTime: 20 }]
  },
  {
    name: "Whole Wheat Spaghetti Bolognese",
    description: "Healthy Italian lunch using whole grain pasta and a lean turkey bolognese sauce.",
    cuisine: "Italian", diet: "High Fiber", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
    prepMinutes: 10, calories: 480, protein: 32, carbs: 65, fat: 12, servings: 4,
    ingredients: [
      { name: "whole wheat spaghetti", quantity: 1, unit: "lb" },
      { name: "ground turkey", quantity: 1, unit: "lb" },
      { name: "tomato puree", quantity: 2, unit: "cups" },
      { name: "onions", quantity: 1, unit: "pcs" }
    ],
    steps: [{ text: "Cook pasta; brown turkey with onions; simmer in tomato sauce.", startTime: 40 }]
  },
  {
    name: "Turkey Taco Bowl",
    description: "Low-carb Mexican lunch bowl with seasoned turkey, black beans, and fresh avocado.",
    cuisine: "Mexican", diet: "Low Carb", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    prepMinutes: 15, calories: 420, protein: 35, carbs: 20, fat: 22, servings: 2,
    ingredients: [
      { name: "ground turkey", quantity: 1, unit: "lb" },
      { name: "black beans", quantity: 1, unit: "cup" },
      { name: "avocado", quantity: 1, unit: "pcs" },
      { name: "pico de gallo", quantity: 0.5, unit: "cup" }
    ],
    steps: [{ text: "Brown turkey; assemble in bowls with beans, salsa, and avocado.", startTime: 20 }]
  },
  {
    name: "Tandoori Style Grilled Chicken",
    description: "Protein-rich Indian dinner with yogurt and spice marinated chicken breast.",
    cuisine: "Indian", diet: "High Protein", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800",
    prepMinutes: 40, calories: 350, protein: 48, carbs: 5, fat: 14, servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 1, unit: "lb" },
      { name: "yogurt", quantity: 1, unit: "cup" },
      { name: "lemon juice", quantity: 2, unit: "tbsp" },
      { name: "tandoori spices", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Marinate chicken; grill at high heat until charred and juicy.", startTime: 40 }]
  },
  {
    name: "Steamed Fish with Scallions",
    description: "Elegant and light Chinese dinner with fresh ginger and scallion soy sauce.",
    cuisine: "Chinese", diet: "Paleo", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800",
    prepMinutes: 10, calories: 280, protein: 35, carbs: 4, fat: 12, servings: 2,
    ingredients: [
      { name: "white fish fillet", quantity: 1, unit: "lb" },
      { name: "scallions", quantity: 3, unit: "pcs" },
      { name: "ginger", quantity: 1, unit: "tbsp" },
      { name: "soy sauce", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Steam fish with ginger; top with scallions and hot soy-oil drizzle.", startTime: 20 }]
  },
  {
    name: "Lemon Herb Grilled Chicken",
    description: "Classic Italian-style chicken with fresh herbs and zesty citrus marinade.",
    cuisine: "Italian", diet: "Gluten Free", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
    prepMinutes: 15, calories: 320, protein: 42, carbs: 2, fat: 15, servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 1, unit: "lb" },
      { name: "olive oil", quantity: 2, unit: "tbsp" },
      { name: "lemon", quantity: 1, unit: "pcs" },
      { name: "rosemary", quantity: 1, unit: "tsp" }
    ],
    steps: [{ text: "Marinate chicken; grill over medium heat until golden.", startTime: 30 }]
  },
  {
    name: "Vegetarian Zucchini Boats",
    description: "Healthy Mexican dinner featuring zucchini stuffed with beans, corn, and light cheese.",
    cuisine: "Mexican", diet: "Vegetarian", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1605106702734-2e999c011e40?w=800",
    prepMinutes: 15, calories: 240, protein: 12, carbs: 28, fat: 10, servings: 2,
    ingredients: [
      { name: "zucchini", quantity: 2, unit: "pcs" },
      { name: "black beans", quantity: 1, unit: "cup" },
      { name: "corn", quantity: 0.5, unit: "cup" },
      { name: "cheddar", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Hollow zucchinis; stuff with bean-corn mix; bake with cheese.", startTime: 35 }]
  },

  // ── USER REPORTED MISSING MEALS ──────────────────
  {
    name: "Avocado Toast with Egg",
    description: "Creamy avocado and a perfectly cooked egg on whole grain toast.",
    cuisine: "American", diet: "High Protein", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
    prepMinutes: 10, calories: 350, protein: 14, carbs: 22, fat: 24, servings: 1,
    ingredients: [{ name: "avocado", quantity: 0.5, unit: "pcs" }, { name: "egg", quantity: 1, unit: "pcs" }, { name: "bread", quantity: 2, unit: "slices" }],
    steps: [{ text: "Toast bread; mash avocado; top with fried egg.", startTime: 10 }]
  },
  {
    name: "Quick Spaghetti Pomodoro",
    description: "Classic Italian pasta in a simple and fresh tomato sauce.",
    cuisine: "Italian", diet: "Vegetarian", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
    prepMinutes: 15, calories: 450, protein: 12, carbs: 68, fat: 14, servings: 1,
    ingredients: [{ name: "spaghetti", quantity: 100, unit: "g" }, { name: "tomato sauce", quantity: 0.5, unit: "cup" }],
    steps: [{ text: "Boil pasta; toss with sauce.", startTime: 20 }]
  },
  {
    name: "Simple Chicken Stir-fry",
    description: "Fast and healthy chicken stir-fry with mixed vegetables and soy sauce.",
    cuisine: "Chinese Fusion", diet: "High Protein", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
    prepMinutes: 15, calories: 380, protein: 32, carbs: 14, fat: 20, servings: 1,
    ingredients: [{ name: "chicken", quantity: 150, unit: "g" }, { name: "mixed veggies", quantity: 1, unit: "cup" }],
    steps: [{ text: "Sauté chicken; add veggies and sauce.", startTime: 20 }]
  }
];

const CookingLog = require("../models/CookingLog");
const User = require("../models/User");

async function runSync() {
  try {
    console.log("Running one-time Database Sync (Macronutrients & History)...");
    
    // 1. Sync Ingredients & Recipes (Existing Logic)
    const ingredientNames = new Set();
    recipesToSync.forEach(r => r.ingredients.forEach(i => ingredientNames.add(i.name.toLowerCase())));
    
    const existingIngredients = await Ingredient.find({ name: { $in: Array.from(ingredientNames) } });
    const existingMap = new Map(existingIngredients.map(i => [i.name.toLowerCase(), i._id]));

    const newIngs = [];
    for (const name of ingredientNames) {
      if (!existingMap.has(name)) {
        newIngs.push({ name, category: "Other", defaultUnit: "pcs", shelfLifeDays: 7 });
      }
    }
    if (newIngs.length) {
      const created = await Ingredient.insertMany(newIngs);
      created.forEach(i => existingMap.set(i.name.toLowerCase(), i._id));
    }

    for (const rData of recipesToSync) {
      const ingredients = rData.ingredients.map(ing => ({
        ...ing,
        ingredientId: existingMap.get(ing.name.toLowerCase()) || new mongoose.Types.ObjectId()
      }));

      await Recipe.findOneAndUpdate(
        { name: rData.name },
        { ...rData, ingredients, status: "published" },
        { upsert: true, new: true }
      );
    }

    // 2. BOOTSTRAP HISTORY (New: Fix for empty Nutritional Analysis)
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      const firstUser = await User.findOne({ role: "user" }) || await User.findOne();
      const existingLogs = await CookingLog.countDocuments({ userId: firstUser._id });
      
      if (existingLogs === 0) {
        console.log("Seeding initial cooking history for Analytics visualization...");
        const sampleRecipes = await Recipe.find({}).limit(5);
        if (sampleRecipes.length > 0) {
          const bootLogs = [];
          for (let i = 1; i <= 10; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const recipe = sampleRecipes[i % sampleRecipes.length];
            bootLogs.push({
              userId: firstUser._id,
              recipeId: recipe._id,
              ingredientsUsed: recipe.ingredients,
              performedAt: date
            });
          }
          await CookingLog.insertMany(bootLogs);
          console.log("Historical data seeded successfully!");
        }
      }
    }

    console.log("Database Sync Completed Successfully!");
  } catch (err) {
    console.error("Auto-Sync Failed:", err.message);
  }
}

module.exports = { runSync };
