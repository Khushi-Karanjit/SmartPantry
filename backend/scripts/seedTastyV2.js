// backend/scripts/seedTastyV2.js
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");

const recipesData = [
  {
    name: "Autumn Vegetable Soup",
    description: "A comforting blend of fall's finest vegetables.",
    videoUrl: "https://www.youtube.com/watch?v=Fq90Xmpk7VM",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    cuisine: "American", diet: "Vegetarian", prepMinutes: 30, calories: 350, servings: 4,
    ingredients: [
      { name: "Pumpkin", quantity: 500, unit: "grams" },
      { name: "Carrot", quantity: 2, unit: "pcs" },
      { name: "Onion", quantity: 1, unit: "pcs" },
      { name: "Vegetable Broth", quantity: 1, unit: "liter" }
    ],
    steps: [
      { text: "Chop all vegetables into cubes.", startTime: 10 },
      { text: "Sauté onions and carrots until soft.", startTime: 45 },
      { text: "Add pumpkin and broth, simmer for 20 minutes.", startTime: 120 },
      { text: "Blend until smooth and serve warm.", startTime: 240 }
    ],
    status: "published"
  },
  {
    name: "Extreme Garlic Chicken",
    description: "For the true garlic lovers. 50 cloves for maximum flavor.",
    videoUrl: "https://www.youtube.com/watch?v=v6FUWXsaLZI",
    imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800",
    cuisine: "French", diet: "High Protein", prepMinutes: 45, calories: 600, servings: 2,
    ingredients: [
      { name: "Chicken Thighs", quantity: 4, unit: "pcs" },
      { name: "Garlic", quantity: 50, unit: "cloves" },
      { name: "Thyme", quantity: 5, unit: "sprigs" },
      { name: "Olive Oil", quantity: 2, unit: "tbsp" }
    ],
    steps: [
      { text: "Peel all 50 cloves of garlic (it's worth it!).", startTime: 15 },
      { text: "Brown the chicken in a large skillet.", startTime: 90 },
      { text: "Add garlic and herbs, cover and roast.", startTime: 180 },
      { text: "Squeeze the softened garlic onto the chicken.", startTime: 300 }
    ],
    status: "published"
  },
  {
    name: "Fairy-Themed Lunch Box",
    description: "Magical butterfly sandwiches and flower-shaped fruits.",
    videoUrl: "https://www.youtube.com/watch?v=T3oiPqSmtgQ",
    imageUrl: "https://images.unsplash.com/photo-1626739011274-169720019284?w=800",
    cuisine: "Creative", diet: "Kid-Friendly", prepMinutes: 15, calories: 400, servings: 1,
    ingredients: [
      { name: "Bread", quantity: 2, unit: "slices" },
      { name: "Cream Cheese", quantity: 30, unit: "grams" },
      { name: "Strawberries", quantity: 5, unit: "pcs" },
      { name: "Cucumber", quantity: 0.5, unit: "pcs" }
    ],
    steps: [
      { text: "Cut bread into butterfly shapes using a cookie cutter.", startTime: 5 },
      { text: "Spread cream cheese and top with sliced strawberries.", startTime: 40 },
      { text: "Carve cucumber into small flower shapes.", startTime: 80 },
      { text: "Assemble the magical lunch box.", startTime: 120 }
    ],
    status: "published"
  },
  {
    name: "Air-Fryer Crispy Bites",
    description: "The ultimate air-fryer hack for perfectly crispy snacks.",
    videoUrl: "https://www.youtube.com/watch?v=KoJ2a8Og8AY",
    imageUrl: "https://images.unsplash.com/photo-1562967914-6cbb241c2935?w=800",
    cuisine: "Fast Food", diet: "Low Fat", prepMinutes: 10, calories: 300, servings: 2,
    ingredients: [
      { name: "Chicken Wings", quantity: 10, unit: "pcs" },
      { name: "Baking Powder", quantity: 1, unit: "tsp" },
      { name: "Paprika", quantity: 1, unit: "tsp" },
      { name: "Salt", quantity: 0.5, unit: "tsp" }
    ],
    steps: [
      { text: "Pat wings dry and toss with baking powder and spices.", startTime: 20 },
      { text: "Place in air fryer basket, do not overcrowd.", startTime: 60 },
      { text: "Air fry at 200°C for 15 minutes, flipping halfway.", startTime: 120 },
      { text: "Serve with your favorite dipping sauce.", startTime: 240 }
    ],
    status: "published"
  },
  {
    name: "Homestyle Baked Mac & Cheese",
    description: "Creamy, cheesy, and topped with a golden breadcrumb crust.",
    videoUrl: "https://www.youtube.com/watch?v=-dZCk-su_X4",
    imageUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800",
    cuisine: "American", diet: "Comfort Food", prepMinutes: 20, calories: 750, servings: 4,
    ingredients: [
      { name: "Macaroni", quantity: 500, unit: "grams" },
      { name: "Cheddar Cheese", quantity: 400, unit: "grams" },
      { name: "Milk", quantity: 500, unit: "ml" },
      { name: "Butter", quantity: 50, unit: "grams" }
    ],
    steps: [
      { text: "Boil macaroni until al dente.", startTime: 10 },
      { text: "Make a roux with butter and flour, then add milk.", startTime: 90 },
      { text: "Melt in the cheddar until smooth and creamy.", startTime: 180 },
      { text: "Combine with pasta, top with more cheese, and bake.", startTime: 300 }
    ],
    status: "published"
  },
  {
    name: "Perfect Homemade Croissants",
    description: "Flaky, buttery layers that melt in your mouth.",
    videoUrl: "https://www.youtube.com/watch?v=djnNkLi_K6E",
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800",
    cuisine: "French", diet: "Vegetarian", prepMinutes: 120, calories: 450, servings: 6,
    ingredients: [
      { name: "Flour", quantity: 500, unit: "grams" },
      { name: "Butter", quantity: 250, unit: "grams" },
      { name: "Yeast", quantity: 1, unit: "packet" },
      { name: "Sugar", quantity: 50, unit: "grams" }
    ],
    steps: [
      { text: "Prepare the dough and let it chill.", startTime: 30 },
      { text: "Create the butter sheet and wrap in dough.", startTime: 120 },
      { text: "Laminate the dough with several folds and chills.", startTime: 300 },
      { text: "Shape into croissants and bake until golden.", startTime: 600 }
    ],
    status: "published"
  },
  {
    name: "Classic Chicken Pot Pie",
    description: "A flaky crust filled with tender chicken and vegetables.",
    videoUrl: "https://www.youtube.com/watch?v=Nf3nIB6lRlg",
    imageUrl: "https://images.unsplash.com/photo-1604467731651-3d964f0f626a?w=800",
    cuisine: "English", diet: "Comfort Food", prepMinutes: 40, calories: 580, servings: 6,
    ingredients: [
      { name: "Chicken", quantity: 400, unit: "grams" },
      { name: "Pie Crust", quantity: 2, unit: "pcs" },
      { name: "Peas", quantity: 100, unit: "grams" },
      { name: "Onion", quantity: 1, unit: "pcs" }
    ],
    steps: [
      { text: "Sauté chicken and vegetables until tender.", startTime: 20 },
      { text: "Stir in flour and broth to make the filling.", startTime: 120 },
      { text: "Pour into the bottom crust and cover with the top.", startTime: 300 },
      { text: "Bake until the crust is golden and flaky.", startTime: 420 }
    ],
    status: "published"
  },
  {
    name: "Creamy Butter Chicken",
    description: "A rich and aromatic curry with tender chicken pieces.",
    videoUrl: "https://www.youtube.com/watch?v=nHj09xU40bM",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
    cuisine: "Indian", diet: "High Protein", prepMinutes: 30, calories: 620, servings: 4,
    ingredients: [
      { name: "Chicken", quantity: 600, unit: "grams" },
      { name: "Tomato Puree", quantity: 400, unit: "ml" },
      { name: "Cream", quantity: 100, unit: "ml" },
      { name: "Garam Masala", quantity: 2, unit: "tsp" }
    ],
    steps: [
      { text: "Marinate chicken in yogurt and spices.", startTime: 15 },
      { text: "Cook chicken in a hot pan until charred.", startTime: 60 },
      { text: "Simmer tomatoes and spices, then add cream.", startTime: 180 },
      { text: "Add chicken back into the sauce and serve.", startTime: 300 }
    ],
    status: "published"
  },
  {
    name: "Spicy Somali Pasta",
    description: "A unique and flavorful pasta dish with a kick.",
    videoUrl: "https://www.youtube.com/watch?v=PMqj2BSW0Yk",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=800",
    cuisine: "African", diet: "All Diets", prepMinutes: 25, calories: 500, servings: 3,
    ingredients: [
      { name: "Spaghetti", quantity: 300, unit: "grams" },
      { name: "Xawaash Spice Mix", quantity: 1, unit: "tbsp" },
      { name: "Ground Beef", quantity: 200, unit: "grams" },
      { name: "Bell Pepper", quantity: 1, unit: "pcs" }
    ],
    steps: [
      { text: "Brown the ground beef with onions and spices.", startTime: 20 },
      { text: "Add peppers and tomato sauce, let simmer.", startTime: 90 },
      { text: "Mix in cooked spaghetti until well coated.", startTime: 150 },
      { text: "Serve hot with a squeeze of lime.", startTime: 210 }
    ],
    status: "published"
  },
  {
    name: "Perfect Cookie Hacks",
    description: "Simple tricks to make the best cookies every time.",
    videoUrl: "https://www.youtube.com/watch?v=RlbjeS-goKE",
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
    cuisine: "Baking", diet: "Dessert", prepMinutes: 10, calories: 150, servings: 12,
    ingredients: [
      { name: "Cookie Dough", quantity: 1, unit: "batch" },
      { name: "Sea Salt", quantity: 1, unit: "pinch" },
      { name: "Cold Butter", quantity: 50, unit: "grams" }
    ],
    steps: [
      { text: "Use cold butter for a fluffier texture.", startTime: 10 },
      { text: "Chill the dough for at least 30 minutes before baking.", startTime: 40 },
      { text: "Top with a sprinkle of sea salt after baking.", startTime: 90 },
      { text: "Let cool on the tray for perfect edges.", startTime: 120 }
    ],
    status: "published"
  },
  {
    name: "Garlic Butter Steak Bites",
    description: "Tender, juicy steak bites seared to perfection and tossed in a rich garlic butter sauce.",
    videoUrl: "https://www.youtube.com/watch?v=FfAPCf0z2Mc",
    imageUrl: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800",
    cuisine: "American", diet: "High Protein", prepMinutes: 15, calories: 550, servings: 2,
    ingredients: [
      { name: "Sirloin Steak", quantity: 500, unit: "grams" },
      { name: "Butter", quantity: 50, unit: "grams" },
      { name: "Garlic", quantity: 4, unit: "cloves" },
      { name: "Parsley", quantity: 1, unit: "tbsp" }
    ],
    steps: [
      { text: "Cut steak into 1-inch cubes and season with salt and pepper.", startTime: 20 },
      { text: "Sear steak in a hot skillet for 2 minutes per side.", startTime: 60 },
      { text: "Add butter and minced garlic; toss until steak is coated.", startTime: 100 },
      { text: "Garnish with fresh parsley and serve hot.", startTime: 140 }
    ],
    status: "published"
  },
  {
    name: "Creamy Tuscan Chicken",
    description: "Pan-seared chicken in a silky cream sauce with sun-dried tomatoes and spinach.",
    videoUrl: "https://www.youtube.com/watch?v=v6FUWXsaLZI",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
    cuisine: "Italian", diet: "Keto Friendly", prepMinutes: 30, calories: 650, servings: 4,
    ingredients: [
      { name: "Chicken Breast", quantity: 4, unit: "pcs" },
      { name: "Heavy Cream", quantity: 1, unit: "cup" },
      { name: "Spinach", quantity: 2, unit: "cups" },
      { name: "Sun-dried Tomatoes", quantity: 0.5, unit: "cup" },
      { name: "Parmesan", quantity: 0.5, unit: "cup" }
    ],
    steps: [
      { text: "Season chicken and pan-fry until golden brown and cooked through.", startTime: 15 },
      { text: "Remove chicken and sauté garlic, then add cream and parmesan.", startTime: 90 },
      { text: "Stir in spinach and sun-dried tomatoes until wilted.", startTime: 150 },
      { text: "Return chicken to the pan and spoon sauce over the top.", startTime: 210 }
    ],
    status: "published"
  },
  {
    name: "Crispy Honey Garlic Salmon",
    description: "Flaky salmon fillets with a sweet and savory garlic glaze.",
    videoUrl: "https://www.youtube.com/watch?v=6U2au324We0",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    cuisine: "Asian Fusion", diet: "Pescatarian", prepMinutes: 20, calories: 480, servings: 2,
    ingredients: [
      { name: "Salmon Fillets", quantity: 2, unit: "pcs" },
      { name: "Honey", quantity: 3, unit: "tbsp" },
      { name: "Soy Sauce", quantity: 2, unit: "tbsp" },
      { name: "Lemon Juice", quantity: 1, unit: "tbsp" },
      { name: "Garlic", quantity: 3, unit: "cloves" }
    ],
    steps: [
      { text: "Season salmon and sear in a pan, skin side down first.", startTime: 20 },
      { text: "Whisk honey, soy sauce, lemon juice, and garlic for the glaze.", startTime: 80 },
      { text: "Pour glaze into the pan and simmer until thickened.", startTime: 120 },
      { text: "Baste the salmon with the glaze until fully cooked.", startTime: 180 }
    ],
    status: "published"
  }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartpantry";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    // Map ingredients
    const allIngs = await Ingredient.find({});
    const ingMap = new Map(allIngs.map(i => [i.name.toLowerCase(), i._id]));

    const processRecipe = async (r) => {
      const ings = [];
      if (r.ingredients) {
        for (const ing of r.ingredients) {
          const nameLower = ing.name.toLowerCase();
          let ingId = ingMap.get(nameLower);

          if (!ingId) {
            // Use findOneAndUpdate with upsert to avoid race conditions
            const updatedIng = await Ingredient.findOneAndUpdate(
              { name: nameLower },
              { $setOnInsert: { name: nameLower, category: "Other", defaultUnit: ing.unit || "pcs" } },
              { upsert: true, new: true }
            );
            ingId = updatedIng._id;
            ingMap.set(nameLower, ingId);
          }
          ings.push({ ...ing, ingredientId: ingId });
        }
      }

      return {
        ...r,
        description: r.description || "A delicious recipe from the Tasty YouTube channel.",
        cuisine: r.cuisine || "Global",
        diet: r.diet || "All Diets",
        prepMinutes: r.prepMinutes || 20,
        calories: r.calories || 400,
        servings: r.servings || 2,
        imageUrl: r.imageUrl || `https://images.unsplash.com/photo-1495461199391-8c39ab674295?w=800`,
        ingredients: ings,
        steps: r.steps || [{ text: "Watch the video for step-by-step instructions!", startTime: 1 }],
        status: "published"
      };
    };

    const finalFullRecipes = await Promise.all(recipesData.map(processRecipe));

    const allFinal = [...finalFullRecipes];
    console.log(`Seeding ${allFinal.length} recipes...`);
    
    // Clear old Tasty-style recipes to avoid huge duplicates during testing
    await Recipe.deleteMany({ videoUrl: { $exists: true } });
    
    await Recipe.insertMany(allFinal);
    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
