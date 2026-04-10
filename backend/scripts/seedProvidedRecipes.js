// backend/scripts/seedProvidedRecipes.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");

const recipesData = [
  {
    name: "Creamy Garlic Parmesan Chicken Pasta",
    description: "A rich and comforting pasta with perfectly seared chicken and a creamy parmesan sauce.",
    cuisine: "Italian",
    diet: "High Protein / Comfort",
    videoUrl: "https://www.youtube.com/watch?v=v6FUWXsaLZI", // Garlic themes
    imageUrl: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800",
    prepMinutes: 25, calories: 750, servings: 4,
    ingredients: [
      { name: "chicken breasts", quantity: 2, unit: "pcs" },
      { name: "penne", quantity: 1, unit: "lb" },
      { name: "chicken broth", quantity: 4, unit: "cups" },
      { name: "heavy cream", quantity: 2, unit: "cups" },
      { name: "parmesan", quantity: 1, unit: "cup" },
      { name: "garlic", quantity: 4, unit: "cloves" },
      { name: "butter", quantity: 2, unit: "tbsp" },
      { name: "parsley", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Season and sear chicken in butter until cooked through; remove from pan.", startTime: 15 },
      { text: "Sauté minced garlic in the same pan, then add broth and heavy cream.", startTime: 45 },
      { text: "Add dry pasta directly to the liquid; simmer for 10–12 minutes until tender.", startTime: 70 },
      { text: "Stir in parmesan and cooked chicken until sauce thickens.", startTime: 125 }
    ]
  },
  {
    name: "One-Pan Garlicky Greek Chicken",
    description: "Healthy and flavorful keto-friendly chicken with kalamata olives and feta cheese.",
    cuisine: "Mediterranean",
    diet: "Keto / Low Carb",
    videoUrl: "https://www.youtube.com/watch?v=iX-93Tp4Ayo", // Greek theme
    imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800",
    prepMinutes: 15, calories: 550, servings: 4,
    ingredients: [
      { name: "chicken thighs", quantity: 4, unit: "pcs" },
      { name: "cherry tomatoes", quantity: 2, unit: "cups" },
      { name: "kalamata olives", quantity: 1, unit: "cup" },
      { name: "red onion", quantity: 1, unit: "pcs" },
      { name: "garlic", quantity: 4, unit: "cloves" },
      { name: "oregano", quantity: 1, unit: "tbsp" },
      { name: "olive oil", quantity: 2, unit: "tbsp" },
      { name: "feta cheese", quantity: 0.5, unit: "cup" }
    ],
    steps: [
      { text: "Whisk oil, garlic, and oregano; coat chicken and vegetables.", startTime: 10 },
      { text: "Place everything on a sheet pan or in a large skillet.", startTime: 30 },
      { text: "Roast at 400°F (200°C) for 30 minutes.", startTime: 55 },
      { text: "Top with crumbled feta and fresh lemon juice.", startTime: 80 }
    ]
  },
  {
    name: "Spinach and Ricotta Stuffed Shells",
    description: "Jumbo pasta shells filled with a creamy spinach and ricotta mix.",
    cuisine: "Italian",
    diet: "Vegetarian",
    videoUrl: "https://www.youtube.com/watch?v=u-vE8PPv5SA", // Dessert/Rich theme
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
    prepMinutes: 30, calories: 450, servings: 6,
    ingredients: [
      { name: "jumbo pasta shells", quantity: 1, unit: "box" },
      { name: "ricotta", quantity: 15, unit: "oz" },
      { name: "chopped spinach", quantity: 10, unit: "oz" },
      { name: "egg", quantity: 1, unit: "pcs" },
      { name: "mozzarella", quantity: 2, unit: "cups" },
      { name: "marinara sauce", quantity: 24, unit: "oz" },
      { name: "nutmeg", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Mix ricotta, spinach, egg, and nutmeg in a bowl.", startTime: 20 },
      { text: "Boil shells until al dente; cool slightly.", startTime: 45 },
      { text: "Spread sauce in a baking dish; stuff shells and align in dish.", startTime: 75 },
      { text: "Top with mozzarella and bake at 375°F (190°C) for 25 minutes.", startTime: 120 }
    ]
  },
  {
    name: "Honey Garlic Chicken Stir-Fry",
    description: "Quick and healthy chicken stir-fry with a glossy honey garlic sauce.",
    cuisine: "Asian",
    diet: "High Protein / Balanced",
    videoUrl: "https://www.youtube.com/watch?v=sfzLo5YXN6k", // 3-Ingredient/Quick theme
    imageUrl: "https://images.unsplash.com/photo-1512058560366-cd24d083da17?w=800",
    prepMinutes: 15, calories: 400, servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 1, unit: "lb" },
      { name: "broccoli florets", quantity: 2, unit: "cups" },
      { name: "honey", quantity: 0.5, unit: "cup" },
      { name: "soy sauce", quantity: 0.33, unit: "cup" },
      { name: "ginger", quantity: 1, unit: "tbsp" },
      { name: "cornstarch", quantity: 2, unit: "tbsp" },
      { name: "sesame oil", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Whisk honey, soy sauce, garlic, and ginger for the sauce.", startTime: 12 },
      { text: "Coat chicken in cornstarch and sear in oil until crispy.", startTime: 35 },
      { text: "Add broccoli and 1/4 cup water; steam for 3 minutes.", startTime: 65 },
      { text: "Pour in sauce and toss until thickened and glossy.", startTime: 100 }
    ]
  },
  {
    name: "Sesame Tofu and Eggplant Noodles",
    description: "Crispy sesame tofu served over tender, soy-glazed eggplant noodles.",
    cuisine: "Asian",
    diet: "Vegan / Low Carb",
    videoUrl: "https://www.youtube.com/watch?v=reSGygkhIi8", // Under 10-Min theme
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    prepMinutes: 20, calories: 350, servings: 2,
    ingredients: [
      { name: "firm tofu", quantity: 1, unit: "block" },
      { name: "large eggplants", quantity: 2, unit: "pcs" },
      { name: "sesame seeds", quantity: 0.25, unit: "cup" },
      { name: "rice vinegar", quantity: 3, unit: "tbsp" },
      { name: "soy sauce", quantity: 2, unit: "tbsp" },
      { name: "chili flakes", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Slice eggplant into thin 'noodles' and toss with salt.", startTime: 8 },
      { text: "Press tofu into sesame seeds and pan-fry until golden.", startTime: 25 },
      { text: "Sauté eggplant noodles until soft; add vinegar and soy sauce.", startTime: 50 },
      { text: "Serve the crispy tofu over the eggplant base.", startTime: 75 }
    ]
  },
  {
    name: "Thai Red Curry with Chicken",
    description: "Fragrant and spicy Thai curry with coconut milk and fish sauce.",
    cuisine: "Asian",
    diet: "Gluten-Free / High Flavor",
    videoUrl: "https://www.youtube.com/watch?v=nHj09xU40bM", // Butter chicken theme (Asian curry)
    imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
    prepMinutes: 15, calories: 600, servings: 4,
    ingredients: [
      { name: "chicken thighs", quantity: 1, unit: "lb" },
      { name: "red curry paste", quantity: 2, unit: "tbsp" },
      { name: "coconut milk", quantity: 1, unit: "can" },
      { name: "red bell pepper", quantity: 1, unit: "pcs" },
      { name: "fish sauce", quantity: 1, unit: "tbsp" },
      { name: "brown sugar", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Fry curry paste in a little oil until fragrant.", startTime: 15 },
      { text: "Add coconut milk and bring to a simmer.", startTime: 30 },
      { text: "Add chicken and peppers; cook for 10 minutes.", startTime: 55 },
      { text: "Stir in fish sauce, sugar, and fresh basil before serving with rice.", startTime: 90 }
    ]
  },
  {
    name: "Philly Cheesesteak Lettuce Wraps",
    description: "Keto-friendly alternative to the classic cheesesteak, wrapped in crisp lettuce.",
    cuisine: "Mexican",
    diet: "Keto / Low Carb",
    videoUrl: "https://www.youtube.com/watch?v=2wJY5sTfQmg", // 7 Tacos theme (Wraps)
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
    prepMinutes: 15, calories: 450, servings: 4,
    ingredients: [
      { name: "flank steak", quantity: 1, unit: "lb" },
      { name: "green bell pepper", quantity: 1, unit: "pcs" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "provolone cheese", quantity: 4, unit: "slices" },
      { name: "butter lettuce leaves", quantity: 8, unit: "pcs" }
    ],
    steps: [
      { text: "Sauté onions and peppers until caramelized.", startTime: 10 },
      { text: "Push veggies aside; sear steak at high heat until browned.", startTime: 35 },
      { text: "Layer cheese over the meat and cover to melt.", startTime: 55 },
      { text: "Scoop mixture into lettuce leaves.", startTime: 80 }
    ]
  },
  {
    name: "Slow Cooker Pork Carnitas",
    description: "Tender and flavorful shredded pork, perfect for tacos or bowls.",
    cuisine: "Mexican",
    diet: "High Protein / Paleo",
    videoUrl: "https://www.youtube.com/watch?v=2wJY5sTfQmg", // Tacos theme
    imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800",
    prepMinutes: 15, calories: 500, servings: 8,
    ingredients: [
      { name: "pork shoulder", quantity: 3, unit: "lb" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "orange", quantity: 1, unit: "pcs" },
      { name: "garlic", quantity: 4, unit: "cloves" },
      { name: "cumin", quantity: 1, unit: "tbsp" },
      { name: "dried oregano", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Rub pork with cumin, oregano, salt, and pepper.", startTime: 15 },
      { text: "Place in slow cooker with onion, garlic, and orange juice.", startTime: 40 },
      { text: "Cook on low for 8 hours; shred with two forks.", startTime: 70 },
      { text: "(Optional) Broil shredded meat for 5 mins to get crispy edges.", startTime: 105 }
    ]
  },
  {
    name: "Sweet Potato and Black Bean Tacos",
    description: "Filling vegetarian tacos with roasted sweet potatoes and lime-infused black beans.",
    cuisine: "Mexican",
    diet: "Vegan / High Fiber",
    videoUrl: "https://www.youtube.com/watch?v=2wJY5sTfQmg", // Tacos theme
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    prepMinutes: 15, calories: 350, servings: 4,
    ingredients: [
      { name: "sweet potatoes", quantity: 2, unit: "pcs" },
      { name: "black beans", quantity: 1, unit: "can" },
      { name: "corn tortillas", quantity: 8, unit: "pcs" },
      { name: "avocado", quantity: 1, unit: "pcs" },
      { name: "smoked paprika", quantity: 1, unit: "tsp" },
      { name: "cumin", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Toss potatoes with oil, paprika, and cumin; roast at 400°F.", startTime: 10 },
      { text: "Warm black beans with a splash of water and lime juice.", startTime: 45 },
      { text: "Char tortillas over an open flame or in a pan.", startTime: 70 },
      { text: "Assemble with roasted potatoes, beans, and sliced avocado.", startTime: 95 }
    ]
  },
  {
    name: "Salmon and Asparagus Sheet Pan Dinner",
    description: "A fresh and healthy pscatarian meal, all made on one sheet pan.",
    cuisine: "American",
    diet: "Pescatarian / Whole30",
    videoUrl: "https://www.youtube.com/watch?v=6U2au324We0", // Make It Fancy theme
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    prepMinutes: 15, calories: 450, servings: 2,
    ingredients: [
      { name: "salmon fillets", quantity: 2, unit: "pcs" },
      { name: "asparagus", quantity: 1, unit: "bunch" },
      { name: "lemon", quantity: 1, unit: "pcs" },
      { name: "olive oil", quantity: 2, unit: "tbsp" },
      { name: "garlic powder", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Place salmon and trimmed asparagus on a baking sheet.", startTime: 15 },
      { text: "Drizzle with oil and season with garlic powder and dill.", startTime: 40 },
      { text: "Top salmon with lemon slices.", startTime: 65 },
      { text: "Bake at 400°F (200°C) for 12–15 minutes.", startTime: 90 }
    ]
  },
  {
    name: "Creamy Beef and Mushroom Stew",
    description: "Warming beef stew with earthy mushrooms and a touch of sour cream.",
    cuisine: "Modern",
    diet: "Comfort / High Protein",
    videoUrl: "https://www.youtube.com/watch?v=Fj-L_86Cq_w", // Beef theme (Placeholder or matching)
    imageUrl: "https://images.unsplash.com/photo-1534939561126-755ecf1d46f3?w=800",
    prepMinutes: 20, calories: 550, servings: 4,
    ingredients: [
      { name: "beef stew meat", quantity: 1, unit: "lb" },
      { name: "mushrooms", quantity: 2, unit: "cups" },
      { name: "carrots", quantity: 2, unit: "pcs" },
      { name: "potatoes", quantity: 3, unit: "pcs" },
      { name: "beef broth", quantity: 3, unit: "cups" },
      { name: "sour cream", quantity: 0.5, unit: "cup" },
      { name: "flour", quantity: 2, unit: "tbsp" }
    ],
    steps: [
      { text: "Coat beef in flour and sear in a pot until browned.", startTime: 20 },
      { text: "Add broth, carrots, potatoes, and mushrooms.", startTime: 50 },
      { text: "Simmer for 1.5 hours until beef is tender.", startTime: 90 },
      { text: "Turn off heat and stir in sour cream for a rich finish.", startTime: 130 }
    ]
  },
  {
    name: "Vegetable Shepherd’s Pie",
    description: "Hearty lentil and vegetable filling topped with creamy mashed potatoes.",
    cuisine: "American",
    diet: "Vegetarian / High Fiber",
    videoUrl: "https://www.youtube.com/watch?v=tkAd0Mjj7N0", // Meal-Prep Ideas
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    prepMinutes: 30, calories: 400, servings: 4,
    ingredients: [
      { name: "dried lentils", quantity: 1, unit: "cup" },
      { name: "mashed potatoes", quantity: 2, unit: "cups" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "carrots", quantity: 2, unit: "pcs" },
      { name: "peas", quantity: 1, unit: "cup" },
      { name: "tomato paste", quantity: 2, unit: "tbsp" },
      { name: "veggie broth", quantity: 1, unit: "cup" }
    ],
    steps: [
      { text: "Sauté onions and carrots; stir in tomato paste and lentils.", startTime: 30 },
      { text: "Add broth and peas; simmer until liquid is reduced.", startTime: 65 },
      { text: "Pour into a dish and spread mashed potatoes on top.", startTime: 105 },
      { text: "Bake at 400°F for 20 minutes until the top is peaked and brown.", startTime: 135 }
    ]
  },
  {
    name: "Prawn Tikka Masala",
    description: "Succulent prawns in a creamy and aromatic spiced tomato sauce.",
    cuisine: "Global",
    diet: "Pescatarian",
    videoUrl: "https://www.youtube.com/watch?v=7AWWfOeLzjc", // Indian Snacks theme
    imageUrl: "https://images.unsplash.com/photo-1585937421612-71100520660f?w=800",
    prepMinutes: 30, calories: 500, servings: 3,
    ingredients: [
      { name: "prawns", quantity: 1, unit: "lb" },
      { name: "tomato puree", quantity: 1, unit: "cup" },
      { name: "heavy cream", quantity: 0.5, unit: "cup" },
      { name: "tikka masala spice mix", quantity: 2, unit: "tbsp" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "ginger-garlic paste", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Sauté onion and ginger-garlic paste until soft.", startTime: 15 },
      { text: "Add spices and tomato puree; simmer for 5 minutes.", startTime: 45 },
      { text: "Add prawns and cook for 3–4 minutes until pink.", startTime: 80 },
      { text: "Stir in cream and serve with naan or rice.", startTime: 115 }
    ]
  },
  {
    name: "Garlic Herb Butter Steak & Potatoes",
    description: "Juicy sirloin steak and crispy potatoes basted in a rich garlic herb butter.",
    cuisine: "American",
    diet: "High Protein / Gluten-Free",
    videoUrl: "https://www.youtube.com/watch?v=FfAPCf0z2Mc", // Lava Stone steak theme
    imageUrl: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800",
    prepMinutes: 20, calories: 700, servings: 2,
    ingredients: [
      { name: "sirloin steak", quantity: 1, unit: "lb" },
      { name: "baby potatoes", quantity: 1, unit: "lb" },
      { name: "butter", quantity: 4, unit: "tbsp" },
      { name: "garlic", quantity: 3, unit: "cloves" },
      { name: "rosemary", quantity: 1, unit: "tbsp" },
      { name: "thyme", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Sauté potatoes in oil for 10–12 minutes until tender; remove.", startTime: 20 },
      { text: "Sear steak in the same pan (3–4 mins per side).", startTime: 55 },
      { text: "Add butter, garlic, and herbs; baste the steak.", startTime: 90 },
      { text: "Add potatoes back to the pan to coat in herb butter.", startTime: 120 }
    ]
  },
  {
    name: "Lemon Garlic Butter Shrimp Pasta",
    description: "A fast and zesty seafood pasta perfect for a busy weeknight.",
    cuisine: "Italian",
    diet: "Pescatarian / Quick Meal",
    videoUrl: "https://www.youtube.com/watch?v=v6FUWXsaLZI", // Garlic themes
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
    prepMinutes: 10, calories: 500, servings: 2,
    ingredients: [
      { name: "shrimp", quantity: 1, unit: "lb" },
      { name: "linguine", quantity: 0.5, unit: "lb" },
      { name: "butter", quantity: 4, unit: "tbsp" },
      { name: "garlic", quantity: 4, unit: "cloves" },
      { name: "lemon", quantity: 1, unit: "pcs" },
      { name: "red pepper flakes", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Boil pasta in salted water.", startTime: 10 },
      { text: "Sauté garlic and red pepper flakes in butter.", startTime: 35 },
      { text: "Add shrimp; cook until opaque (about 3 minutes).", startTime: 60 },
      { text: "Toss in cooked pasta, lemon juice, and pasta water to emulsify.", startTime: 100 }
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

    console.log(`Seeding ${results.length} featured recipes...`);
    await Recipe.insertMany(results);
    console.log("Featured recipes seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
