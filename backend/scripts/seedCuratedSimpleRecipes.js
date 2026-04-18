// backend/scripts/seedCuratedSimpleRecipes.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");
const { calculateRecipeMacros } = require("../src/services/nutrition.service");

const simpleRecipes = [
  {
    name: "Classic Pancakes",
    description: "Fluffy and incredibly simple morning pancakes.",
    cuisine: "American",
    diet: "Vegetarian",
    imageUrl: "https://images.unsplash.com/photo-1598514982205-f36b96d1ea8d?w=800",
    prepMinutes: 10, servings: 2, mealType: "breakfast",
    ingredients: [
      { name: "Flour", quantity: 1, unit: "cup" },
      { name: "Milk", quantity: 1, unit: "cup" },
      { name: "Egg", quantity: 1, unit: "pcs" },
      { name: "Butter", quantity: 2, unit: "tbsp" },
      { name: "Sugar", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Crack the egg into a large mixing bowl.", startTime: 0 },
      { text: "Pour in the milk and whisk until smooth.", startTime: 30 },
      { text: "Melt the butter and stir it into the wet ingredients.", startTime: 60 },
      { text: "Slowly fold in the flour and sugar until just combined, being careful not to overmix.", startTime: 90 },
      { text: "Heat a skillet over medium heat.", startTime: 120 },
      { text: "Pour the batter in small circles onto the skillet.", startTime: 150 },
      { text: "Wait for bubbles to appear on the surface, then flip the pancakes.", startTime: 240 },
      { text: "Cook the other side until golden brown and serve.", startTime: 300 }
    ]
  },
  {
    name: "Lemon Garlic Chicken",
    description: "A quick, bright, and savory pan-seared chicken breast.",
    cuisine: "Mediterranean",
    diet: "High Protein",
    imageUrl: "https://images.unsplash.com/photo-1598515322627-90cb8b525208?w=800",
    prepMinutes: 15, servings: 2, mealType: "dinner",
    ingredients: [
      { name: "Chicken Breast", quantity: 2, unit: "pcs" },
      { name: "Garlic", quantity: 3, unit: "cloves" },
      { name: "Lemon", quantity: 1, unit: "pcs" },
      { name: "Olive Oil", quantity: 2, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Pat the chicken breasts dry with a paper towel.", startTime: 0 },
      { text: "Season both sides generously with salt and pepper.", startTime: 30 },
      { text: "Mince the garlic cloves finely.", startTime: 90 },
      { text: "Heat the olive oil in a skillet over medium heat.", startTime: 120 },
      { text: "Add the chicken to the skillet and sear for 5 minutes.", startTime: 180 },
      { text: "Flip the chicken to cook the other side.", startTime: 480 },
      { text: "Squeeze the juice from the lemon directly over the chicken in the pan.", startTime: 500 },
      { text: "Add the minced garlic and cook for 1 more minute until fragrant.", startTime: 530 }
    ]
  },
  {
    name: "Simple Egg Fried Rice",
    description: "The easiest, fast-prep fried rice utilizing leftover rice.",
    cuisine: "Chinese",
    diet: "Balanced",
    imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
    prepMinutes: 15, servings: 2, mealType: "lunch",
    ingredients: [
      { name: "Cooked Rice", quantity: 3, unit: "cups" },
      { name: "Egg", quantity: 2, unit: "pcs" },
      { name: "Soy Sauce", quantity: 2, unit: "tbsp" },
      { name: "Green Onion", quantity: 2, unit: "pcs" },
      { name: "Vegetable Oil", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Slice the green onions and set them aside.", startTime: 0 },
      { text: "Crack the eggs into a small bowl and beat them lightly.", startTime: 60 },
      { text: "Heat the vegetable oil in a large wok or frying pan over high heat.", startTime: 120 },
      { text: "Pour the beaten eggs into the pan and scramble quickly.", startTime: 180 },
      { text: "Add the cold cooked rice to the pan.", startTime: 210 },
      { text: "Break up the rice clumps and toss constantly over high heat.", startTime: 240 },
      { text: "Drizzle the soy sauce evenly over the rice.", startTime: 300 },
      { text: "Toss everything together until the color is uniform.", startTime: 330 },
      { text: "Garnish with the green onions and serve hot.", startTime: 360 }
    ]
  },
  {
    name: "Basic Pasta Pomodoro",
    description: "A fast, 5-ingredient Italian classic.",
    cuisine: "Italian",
    diet: "Vegetarian",
    imageUrl: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800",
    prepMinutes: 20, servings: 2, mealType: "dinner",
    ingredients: [
      { name: "Spaghetti", quantity: 200, unit: "g" },
      { name: "Tomato Paste", quantity: 3, unit: "tbsp" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Garlic", quantity: 2, unit: "cloves" },
      { name: "Salt", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Fill a large pot with water and bring it to a rolling boil.", startTime: 0 },
      { text: "Add salt to the boiling water.", startTime: 300 },
      { text: "Drop the spaghetti into the water and stir immediately.", startTime: 330 },
      { text: "Mince the garlic cloves.", startTime: 360 },
      { text: "Heat olive oil in a wide frying pan over low heat.", startTime: 420 },
      { text: "Add the minced garlic and cook gently until golden.", startTime: 450 },
      { text: "Stir the tomato paste into the garlic and oil.", startTime: 500 },
      { text: "Ladle half a cup of pasta water into the sauce and mix well.", startTime: 560 },
      { text: "Drain the pasta and toss it directly in the pan with the sauce.", startTime: 600 }
    ]
  },
  {
    name: "Quick Avocado Toast",
    description: "Simple, creamy avocado on toasted bread seasoned perfectly.",
    cuisine: "American",
    diet: "Vegan",
    imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800",
    prepMinutes: 5, servings: 1, mealType: "breakfast",
    ingredients: [
      { name: "Bread", quantity: 2, unit: "slices" },
      { name: "Avocado", quantity: 1, unit: "pcs" },
      { name: "Lemon", quantity: 0.5, unit: "pcs" },
      { name: "Salt", quantity: 0.5, unit: "tsp" },
      { name: "Black Pepper", quantity: 0.5, unit: "tsp" }
    ],
    steps: [
      { text: "Place the slices of bread into a toaster.", startTime: 0 },
      { text: "Cut the avocado in half and remove the pit.", startTime: 30 },
      { text: "Scoop the avocado flesh into a small bowl.", startTime: 60 },
      { text: "Squeeze the lemon juice over the avocado.", startTime: 90 },
      { text: "Mash the avocado with a fork until creamy but slightly chunky.", startTime: 120 },
      { text: "Spread the mashed avocado evenly onto the toasted bread.", startTime: 180 },
      { text: "Sprinkle salt and black pepper over the top.", startTime: 210 }
    ]
  }
];

async function seed() {
  try {
    const remoteUri = process.env.MONGO_URI;
    const localUri = "mongodb://127.0.0.1:27017/smartpantry";
    
    console.log("Attempting to connect to MongoDB...");
    try {
      if (remoteUri) await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 5000 });
      else throw new Error("No remote URI found");
    } catch (remoteErr) {
      await mongoose.connect(localUri);
    }

    console.log("Purging complex recipe data...");
    await Recipe.deleteMany({});
    
    const results = [];
    
    console.log("Normalizing ingredients and calculating perfect macros...");
    for (const recipe of simpleRecipes) {
      const enrichedIngredients = [];
      
      for (const ing of recipe.ingredients) {
        // Find existing ingredient or create a normalized one
        let match = await Ingredient.findOne({ 
          name: { $regex: new RegExp(`^${ing.name}$`, "i") } 
        });

        if (!match) {
          match = await Ingredient.create({ 
            name: ing.name, 
            category: "Other", 
            defaultUnit: ing.unit 
          });
        }
        
        enrichedIngredients.push({
          name: match.name,
          quantity: ing.quantity,
          unit: ing.unit,
          ingredientId: match._id
        });
      }
      
      // Hit the central Nutrition Service engine
      const macros = await calculateRecipeMacros(enrichedIngredients);
      
      results.push({
        ...recipe,
        ingredients: enrichedIngredients,
        calories: macros.calories || 0,
        protein: macros.protein || 0,
        carbs: macros.carbs || 0,
        fat: macros.fat || 0,
        status: "published"
      });
    }

    await Recipe.insertMany(results);
    console.log(`Successfully seeded ${results.length} clean, step-by-step recipes with auto-macros!`);
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
