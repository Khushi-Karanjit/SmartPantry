// backend/scripts/seedProfessionalRecipes.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");

const recipesData = [
  {
    name: "Pan-Seared Salmon with Lemon Herb Butter",
    description: "Crispy, golden-seared salmon fillets bathed in a rich, tangy lemon and herb butter sauce.",
    cuisine: "French",
    diet: "Pescatarian / Low Carb",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    prepMinutes: 20, calories: 450, servings: 2,
    ingredients: [
      { name: "Salmon Fillets", quantity: 2, unit: "pcs" },
      { name: "Butter", quantity: 3, unit: "tbsp" },
      { name: "Garlic", quantity: 2, unit: "cloves" },
      { name: "Lemon Juice", quantity: 1, unit: "tbsp" },
      { name: "Fresh Parsley", quantity: 1, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Black Pepper", quantity: 0.5, unit: "tsp" }
    ],
    steps: [
      { text: "Pat salmon dry and season generously with salt and pepper.", startTime: 10 },
      { text: "Heat olive oil in a skillet over medium-high heat. Sear salmon skin-side down.", startTime: 30 },
      { text: "Flip the salmon after 4 minutes, then reduce heat.", startTime: 60 },
      { text: "Add butter, minced garlic, and lemon juice. Baste salmon with the butter mixture.", startTime: 90 },
      { text: "Garnish with fresh parsley and serve immediately.", startTime: 120 }
    ]
  },
  {
    name: "Classic Beef Wellington",
    description: "A show-stopping main course featuring tender beef fillet coated in mushroom duxelles, wrapped in prosciutto and flaky puff pastry.",
    cuisine: "British",
    diet: "High Protein",
    imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800",
    prepMinutes: 120, calories: 850, servings: 6,
    ingredients: [
      { name: "Beef Tenderloin", quantity: 1, unit: "kg" },
      { name: "Mushrooms", quantity: 500, unit: "grams" },
      { name: "Prosciutto", quantity: 100, unit: "grams" },
      { name: "Puff Pastry", quantity: 1, unit: "sheet" },
      { name: "Egg", quantity: 1, unit: "pcs" },
      { name: "Mustard", quantity: 2, unit: "tbsp" }
    ],
    steps: [
      { text: "Sear the beef tenderloin on all sides until browned, then brush with mustard and let cool.", startTime: 20 },
      { text: "Finely chop mushrooms and cook until all moisture has evaporated to create a duxelles.", startTime: 60 },
      { text: "Lay out prosciutto, spread with duxelles, and wrap tightly around the beef.", startTime: 150 },
      { text: "Wrap the beef bundle in puff pastry, brush with egg wash, and chill.", startTime: 300 },
      { text: "Bake at 400°F (200°C) until golden brown and the beef reaches desired doneness.", startTime: 420 },
      { text: "Rest for 10 minutes before slicing.", startTime: 480 }
    ]
  },
  {
    name: "Authentic Roman Carbonara",
    description: "A classic Italian pasta relying solely on eggs, Pecorino Romano, guanciale, and black pepper for its creamy sauce.",
    cuisine: "Italian",
    diet: "Comfort Food",
    imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
    prepMinutes: 15, calories: 550, servings: 2,
    ingredients: [
      { name: "Spaghetti", quantity: 200, unit: "grams" },
      { name: "Guanciale", quantity: 100, unit: "grams" },
      { name: "Eggs", quantity: 2, unit: "pcs" },
      { name: "Pecorino Romano", quantity: 50, unit: "grams" },
      { name: "Black Pepper", quantity: 1, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "pinch" }
    ],
    steps: [
      { text: "Whisk eggs with grated Pecorino and freshly cracked black pepper.", startTime: 10 },
      { text: "Crisp the guanciale in a wide skillet until golden, reserving the fat.", startTime: 30 },
      { text: "Cook spaghetti in heavily salted water until al dente.", startTime: 60 },
      { text: "Transfer pasta to the skillet with guanciale off the heat. Stir in the egg mixture quickly, adding pasta water to create a creamy emulsion.", startTime: 90 },
      { text: "Serve immediately with extra cheese and pepper.", startTime: 120 }
    ]
  },
  {
    name: "Hearty Mushroom Risotto",
    description: "Creamy, slow-cooked Arborio rice enriched with earthy wild mushrooms, white wine, and Parmesan.",
    cuisine: "Italian",
    diet: "Vegetarian",
    imageUrl: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800",
    prepMinutes: 40, calories: 480, servings: 4,
    ingredients: [
      { name: "Arborio Rice", quantity: 1.5, unit: "cups" },
      { name: "Vegetable Broth", quantity: 4, unit: "cups" },
      { name: "Wild Mushrooms", quantity: 300, unit: "grams" },
      { name: "White Wine", quantity: 0.5, unit: "cup" },
      { name: "Onion", quantity: 1, unit: "pcs" },
      { name: "Parmesan Cheese", quantity: 0.5, unit: "cup" },
      { name: "Butter", quantity: 3, unit: "tbsp" }
    ],
    steps: [
      { text: "Warm vegetable broth in a separate saucepan.", startTime: 5 },
      { text: "Sauté mushrooms in butter until browned, then set aside.", startTime: 25 },
      { text: "In the same pan, sweat onions, then toast the Arborio rice for 2 minutes.", startTime: 50 },
      { text: "Deglaze with white wine and cook until absorbed.", startTime: 75 },
      { text: "Gradually ladle in warm broth, stirring constantly until rice is creamy and al dente.", startTime: 150 },
      { text: "Stir in the cooked mushrooms, Parmesan, and a knob of butter before serving.", startTime: 200 }
    ]
  },
  {
    name: "Thai Green Curry with Basil",
    description: "A vibrant and aromatic curry featuring tender chicken, fresh vegetables, and a creamy coconut-green chili base.",
    cuisine: "Thai",
    diet: "Balanced",
    imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
    prepMinutes: 30, calories: 520, servings: 4,
    ingredients: [
      { name: "Chicken Breast", quantity: 400, unit: "grams" },
      { name: "Coconut Milk", quantity: 400, unit: "ml" },
      { name: "Green Curry Paste", quantity: 3, unit: "tbsp" },
      { name: "Bamboo Shoots", quantity: 100, unit: "grams" },
      { name: "Bell Pepper", quantity: 1, unit: "pcs" },
      { name: "Thai Basil", quantity: 1, unit: "handful" },
      { name: "Fish Sauce", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Sauté green curry paste in a bit of oil to release aromatics.", startTime: 10 },
      { text: "Whisk in coconut milk and bring to a gentle simmer.", startTime: 30 },
      { text: "Add sliced chicken breast and simmer until cooked through.", startTime: 60 },
      { text: "Stir in bamboo shoots, sliced bell pepper, and fish sauce.", startTime: 90 },
      { text: "Remove from heat, fold in fresh Thai basil leaves, and serve with jasmine rice.", startTime: 110 }
    ]
  }
];

async function seed() {
  try {
    const remoteUri = process.env.MONGO_URI;
    const localUri = "mongodb://127.0.0.1:27017/smartpantry";
    
    console.log("Attempting to connect to MongoDB...");
    try {
      if (remoteUri) {
        await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected to Remote MongoDB!");
      } else {
        throw new Error("No remote URI found");
      }
    } catch (remoteErr) {
      console.warn("Remote connection failed, trying local fallback:", remoteErr.message);
      await mongoose.connect(localUri);
      console.log("Connected to Local MongoDB!");
    }

    console.log("Purging all existing recipes to ensure a clean, professional state...");
    await Recipe.deleteMany({});
    
    const allIngs = await Ingredient.find({});
    const ingMap = new Map(allIngs.map(i => [i.name.toLowerCase(), i._id]));

    const results = [];
    for (const r of recipesData) {
      const ings = [];
      for (const ing of r.ingredients) {
        let ingId = ingMap.get(ing.name.toLowerCase());
        if (!ingId) {
          const newIng = await Ingredient.findOneAndUpdate(
            { name: ing.name.toLowerCase() },
            { $setOnInsert: { name: ing.name.toLowerCase(), category: "Other", defaultUnit: ing.unit || "pcs" } },
            { upsert: true, new: true }
          );
          ingId = newIng._id;
          ingMap.set(ing.name.toLowerCase(), ingId);
        }
        ings.push({ ...ing, ingredientId: ingId });
      }

      results.push({
        ...r,
        ingredients: ings,
        status: "published"
      });
    }

    console.log(`Seeding ${results.length} professional recipes...`);
    await Recipe.insertMany(results);
    console.log("Professional recipes seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
