// backend/scripts/seedProvidedRecipesV2.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");

const recipesData = [
  {
    name: "Homemade Butter Chicken (Murgh Makhani)",
    description: "Authentic, rich, and creamy Indian butter chicken with tender marinated thighs.",
    cuisine: "Indian",
    diet: "High Protein / Comfort",
    videoUrl: "https://www.youtube.com/watch?v=1F9y3o9d_Qo", // Tasty Butter Chicken
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
    prepMinutes: 45, calories: 650, servings: 4,
    ingredients: [
      { name: "chicken thighs", quantity: 1, unit: "lb" },
      { name: "tomato puree", quantity: 1, unit: "cup" },
      { name: "heavy cream", quantity: 0.5, unit: "cup" },
      { name: "ginger-garlic paste", quantity: 1, unit: "tbsp" },
      { name: "butter", quantity: 2, unit: "tbsp" },
      { name: "garam masala", quantity: 1, unit: "tsp" },
      { name: "chili powder", quantity: 1, unit: "tsp" },
      { name: "yogurt", quantity: 0.5, unit: "cup" }
    ],
    steps: [
      { text: "Marinate chicken in yogurt and spices for at least 30 minutes.", startTime: 15 },
      { text: "Sear chicken in a pan until browned; set aside.", startTime: 45 },
      { text: "Melt butter, sauté ginger-garlic paste, and add tomato puree and spices.", startTime: 70 },
      { text: "Stir in cream and chicken; simmer for 10 minutes until thick.", startTime: 100 }
    ]
  },
  {
    name: "Red Lentil Dal (Tarka Dal)",
    description: "A nutritious and comforting vegan dal with a fragrant spiced oil tempering (Tarka).",
    cuisine: "Indian",
    diet: "Vegan / High Fiber",
    videoUrl: "https://www.youtube.com/watch?v=MFtv0aUqMUA", // Red Lentil Dal
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
    prepMinutes: 15, calories: 300, servings: 4,
    ingredients: [
      { name: "red lentils", quantity: 1, unit: "cup" },
      { name: "water", quantity: 3, unit: "cups" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "tomatoes", quantity: 2, unit: "pcs" },
      { name: "turmeric", quantity: 1, unit: "tsp" },
      { name: "cumin seeds", quantity: 1, unit: "tsp" },
      { name: "dried chilies", quantity: 2, unit: "pcs" },
      { name: "garlic", quantity: 3, unit: "cloves" }
    ],
    steps: [
      { text: "Boil lentils with water and turmeric until soft and mushy.", startTime: 10 },
      { text: "In a separate small pan, heat oil and fry cumin seeds, garlic, and chilies (the 'Tarka').", startTime: 35 },
      { text: "Sauté onions and tomatoes in the Tarka until soft.", startTime: 65 },
      { text: "Pour the Tarka mixture into the boiled lentils and stir.", startTime: 105 }
    ]
  },
  {
    name: "One-Pot Chicken Fajita Pasta",
    description: "A quick, one-pot student-favorite combining Mexican fajita flavors with creamy Italian pasta.",
    cuisine: "Mexican Fusion",
    diet: "Balanced / Easy Cleanup",
    videoUrl: "https://www.youtube.com/watch?v=P_N1Q4H8Tps", // Chicken Fajita Pasta
    imageUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800",
    prepMinutes: 10, calories: 550, servings: 2,
    ingredients: [
      { name: "chicken breasts", quantity: 2, unit: "pcs" },
      { name: "bell pepper", quantity: 1, unit: "pcs" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "penne", quantity: 2, unit: "cups" },
      { name: "chicken broth", quantity: 3, unit: "cups" },
      { name: "heavy cream", quantity: 0.5, unit: "cup" },
      { name: "taco seasoning", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Sauté sliced chicken, peppers, and onions in a large pot.", startTime: 10 },
      { text: "Add dry pasta, broth, and taco seasoning to the same pot.", startTime: 40 },
      { text: "Boil for 10–12 minutes until pasta is cooked and liquid reduces.", startTime: 75 },
      { text: "Stir in cream and cheese for a velvety finish.", startTime: 110 }
    ]
  },
  {
    name: "Sheet Pan Orange Chicken & Veggies",
    description: "Effortless sheet pan orange chicken perfect for healthy weekly meal prep.",
    cuisine: "Asian Fusion",
    diet: "High Protein / Meal Prep",
    videoUrl: "https://www.youtube.com/watch?v=K3fT9h2mHhE", // Orange Chicken
    imageUrl: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800",
    prepMinutes: 15, calories: 450, servings: 4,
    ingredients: [
      { name: "chicken breast", quantity: 1, unit: "lb" },
      { name: "broccoli", quantity: 2, unit: "cups" },
      { name: "red pepper", quantity: 1, unit: "pcs" },
      { name: "orange marmalade", quantity: 0.5, unit: "cup" },
      { name: "soy sauce", quantity: 2, unit: "tbsp" },
      { name: "ginger", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Whisk marmalade, soy sauce, and ginger to make the glaze.", startTime: 15 },
      { text: "Toss chicken and veggies in half the glaze on a baking sheet.", startTime: 35 },
      { text: "Bake at 400°F (200°C) for 20 minutes.", startTime: 60 },
      { text: "Drizzle remaining glaze over the hot food before serving.", startTime: 100 }
    ]
  },
  {
    name: "Cheesy Stuffed Garlic Bread (Meal-Sized)",
    description: "A decadent and comforting meal-sized garlic bread stuffed with two types of cheese.",
    cuisine: "Baking",
    diet: "Vegetarian / Comfort",
    videoUrl: "https://www.youtube.com/watch?v=s_q4cK5N3_U", // Tasty Stuffed Garlic Bread
    imageUrl: "https://images.unsplash.com/photo-1573140401552-3fab0b24306f?w=800",
    prepMinutes: 20, calories: 800, servings: 2,
    ingredients: [
      { name: "French bread", quantity: 1, unit: "loaf" },
      { name: "mozzarella", quantity: 1, unit: "cup" },
      { name: "cheddar", quantity: 0.5, unit: "cup" },
      { name: "butter", quantity: 4, unit: "tbsp" },
      { name: "garlic", quantity: 3, unit: "cloves" },
      { name: "parsley", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Slice the bread crosswise (don't cut all the way through).", startTime: 15 },
      { text: "Stuff the gaps with a mix of cheeses.", startTime: 45 },
      { text: "Brush the top with melted garlic butter and parsley.", startTime: 80 },
      { text: "Wrap in foil and bake at 375°F (190°C) for 15 minutes.", startTime: 115 }
    ]
  },
  {
    name: "3-Ingredient Banana Bread",
    description: "The easiest banana bread ever made with just 3 simple pantry staples.",
    cuisine: "Baking",
    diet: "Vegetarian",
    videoUrl: "https://www.youtube.com/watch?v=0kF60iV6oZY", // Tasty Banana Bread
    imageUrl: "https://images.unsplash.com/photo-1605658603613-6fdf3964468f?w=800",
    prepMinutes: 10, calories: 350, servings: 8,
    ingredients: [
      { name: "ripe bananas", quantity: 3, unit: "pcs" },
      { name: "eggs", quantity: 2, unit: "pcs" },
      { name: "yellow cake mix", quantity: 1, unit: "box" }
    ],
    steps: [
      { text: "Mash bananas in a large bowl until smooth.", startTime: 10 },
      { text: "Whisk in eggs and then fold in the cake mix.", startTime: 30 },
      { text: "Pour into a greased loaf pan.", startTime: 60 },
      { text: "Bake at 350°F (180°C) for 45–50 minutes.", startTime: 105 }
    ]
  },
  {
    name: "Steamed Chicken Momos (Dumplings)",
    description: "Authentic Nepali-style steamed chicken dumplings flavored with Sichuan pepper.",
    cuisine: "Nepali",
    diet: "High Protein",
    videoUrl: "https://www.youtube.com/watch?v=03D95w9j4o0", // Chicken Momos
    imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800",
    prepMinutes: 40, calories: 400, servings: 2,
    ingredients: [
      { name: "ground chicken", quantity: 1, unit: "lb" },
      { name: "scallions", quantity: 1, unit: "bunch" },
      { name: "soy sauce", quantity: 2, unit: "tbsp" },
      { name: "ginger", quantity: 1, unit: "tbsp" },
      { name: "dumpling wrappers", quantity: 1, unit: "pack" },
      { name: "Sichuan pepper", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Mix chicken, scallions, ginger, and spices in a bowl.", startTime: 20 },
      { text: "Place a spoonful of filling in the center of a wrapper; pleat the edges.", startTime: 55 },
      { text: "Grease a steamer basket and arrange momos.", startTime: 90 },
      { text: "Steam for 10–12 minutes. Serve with tomato achar (chutney).", startTime: 130 }
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
        console.log("Trying remote URI...");
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

    console.log(`Seeding ${results.length} additional featured recipes...`);
    await Recipe.insertMany(results);
    console.log("Featured recipes V2 seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
