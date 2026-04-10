// backend/scripts/dbSync.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");

const recipesToSync = [
  // 15 Featured Recipes from V1
  {
    name: "Creamy Garlic Parmesan Chicken Pasta",
    description: "A rich and comforting pasta with perfectly seared chicken and a creamy parmesan sauce.",
    cuisine: "Italian",
    diet: "High Protein / Comfort",
    videoUrl: "https://www.youtube.com/watch?v=v6FUWXsaLZI",
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
    videoUrl: "https://www.youtube.com/watch?v=iX-93Tp4Ayo",
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
    videoUrl: "https://www.youtube.com/watch?v=u-vE8PPv5SA",
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
    videoUrl: "https://www.youtube.com/watch?v=sfzLo5YXN6k",
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
    videoUrl: "https://www.youtube.com/watch?v=reSGygkhIi8",
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
    videoUrl: "https://www.youtube.com/watch?v=nHj09xU40bM",
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
    cuisine: "American Fusion",
    diet: "Keto / Low Carb",
    videoUrl: "https://www.youtube.com/watch?v=2wJY5sTfQmg",
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
    videoUrl: "https://www.youtube.com/watch?v=2wJY5sTfQmg",
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
    videoUrl: "https://www.youtube.com/watch?v=2wJY5sTfQmg",
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
    videoUrl: "https://www.youtube.com/watch?v=6U2au324We0",
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
    cuisine: "American Fusion",
    diet: "Comfort / High Protein",
    videoUrl: "https://www.youtube.com/watch?v=Fj-L_86Cq_w",
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
    videoUrl: "https://www.youtube.com/watch?v=tkAd0Mjj7N0",
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
    cuisine: "Indian Fusion",
    diet: "Pescatarian",
    videoUrl: "https://www.youtube.com/watch?v=7AWWfOeLzjc",
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
    videoUrl: "https://www.youtube.com/watch?v=FfAPCf0z2Mc",
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
    name: "Classic Nepali Dal Bhat",
    description: "The staple meal of Nepal - nutritious lentil soup with rice.",
    cuisine: "Nepali",
    diet: "Vegan",
    prepMinutes: 40,
    calories: 600,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1546039907-7fa05f864c02?q=80&w=300",
    videoUrl: "https://www.youtube.com/watch?v=Gk3K8bXFf4o",
    ingredients: [
      { name: "Rice", quantity: 500, unit: "grams" },
      { name: "Lentils", quantity: 200, unit: "grams" },
      { name: "Turmeric", quantity: 1, unit: "tsp" },
      { name: "Mustard Oil", quantity: 2, unit: "tbsp" },
    ],
    steps: [
      { text: "Cook rice with 2x water until fluffy.", startTime: 10 },
      { text: "Boil lentils with turmeric until soft.", startTime: 45 },
      { text: "Heat oil and fry garlic until golden.", startTime: 120 },
      { text: "Combine lentils with fried garlic and serve over rice.", startTime: 180 }
    ],
    status: "published"
  },
  {
    name: "Avocado Toast with Egg",
    description: "A trendy, healthy, and easy breakfast.",
    cuisine: "Universal",
    diet: "Vegetarian",
    prepMinutes: 10,
    calories: 350,
    servings: 1,
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300",
    videoUrl: "https://www.youtube.com/watch?v=WwN1XoE-Bsw",
    ingredients: [
      { name: "Bread", quantity: 2, unit: "slices" },
      { name: "Avocado", quantity: 1, unit: "pcs" },
      { name: "Eggs", quantity: 1, unit: "pcs" },
      { name: "Butter", quantity: 5, unit: "grams" },
    ],
    steps: [
      { text: "Toast the bread slices until golden.", startTime: 10 },
      { text: "Mash avocado with salt and pepper.", startTime: 30 },
      { text: "Fry egg in butter until done.", startTime: 60 },
      { text: "Assemble and serve immediately.", startTime: 90 }
    ],
    status: "published"
  },
  {
    name: "Quick Spaghetti Pomodoro",
    description: "Classic Italian pasta with a rich tomato sauce.",
    cuisine: "Italian",
    diet: "Vegetarian",
    prepMinutes: 20,
    calories: 450,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=300",
    videoUrl: "https://www.youtube.com/watch?v=xSg-kY0eH9E",
    ingredients: [
      { name: "Pasta", quantity: 250, unit: "grams" },
      { name: "Tomato Sauce", quantity: 400, unit: "ml" },
      { name: "Olive Oil", quantity: 2, unit: "tbsp" },
      { name: "Basil", quantity: 10, unit: "grams" },
      { name: "Parmesan", quantity: 50, unit: "grams" },
    ],
    steps: [
      { text: "Boil pasta in salted water until al dente.", startTime: 15 },
      { text: "Simmer tomato sauce with olive oil and basil.", startTime: 60 },
      { text: "Toss drained pasta directly in the sauce.", startTime: 120 },
      { text: "Plate and top generously with parmesan.", startTime: 150 }
    ],
    status: "published"
  },
  {
    name: "Simple Chicken Stir-fry",
    description: "Fast and healthy chicken with soy sauce and ginger.",
    cuisine: "Asian",
    diet: "High Protein",
    prepMinutes: 15,
    calories: 380,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1603133872878-085e12da636c?q=80&w=300",
    videoUrl: "https://www.youtube.com/watch?v=S0Tq_m_fXkM",
    ingredients: [
      { name: "Chicken Breast", quantity: 400, unit: "grams" },
      { name: "Soy Sauce", quantity: 3, unit: "tbsp" },
      { name: "Ginger", quantity: 10, unit: "grams" },
      { name: "Garlic", quantity: 15, unit: "grams" },
      { name: "Onion", quantity: 100, unit: "grams" },
    ],
    steps: [
      { text: "Dice chicken breast and onion into even pieces.", startTime: 15 },
      { text: "Sauté ginger and garlic in hot oil until fragrant.", startTime: 40 },
      { text: "Add chicken and stir-fry until cooked through.", startTime: 75 },
      { text: "Deglaze with soy sauce and serve over rice.", startTime: 150 }
    ],
    status: "published"
  },
  {
    name: "Tuna Salad with Lemon",
    description: "A fresh and high-protein salad in minutes.",
    cuisine: "Mediterranean",
    diet: "Keto",
    prepMinutes: 5,
    calories: 220,
    servings: 1,
    imageUrl: "https://images.unsplash.com/photo-1546039907-7fa05f864c02?q=80&w=300",
    videoUrl: "https://www.youtube.com/watch?v=02wN5rVpT0E",
    ingredients: [
      { name: "Canned Tuna", quantity: 1, unit: "can" },
      { name: "Lemon", quantity: 0.5, unit: "pcs" },
      { name: "Olive Oil", quantity: 1, unit: "tbsp" },
      { name: "Onion", quantity: 30, unit: "grams" },
    ],
    steps: [
      { text: "Drain the canned tuna thoroughly.", startTime: 5 },
      { text: "Mix tuna with chopped onion, olive oil, and lemon juice.", startTime: 25 },
      { text: "Season with salt and pepper to taste. Serve cold.", startTime: 60 }
    ],
    status: "published"
  },
  {
    name: "Butter Garlic Eggs",
    description: "Elevate your morning eggs with fragrant garlic.",
    cuisine: "Universal",
    diet: "Vegetarian",
    prepMinutes: 8,
    calories: 180,
    servings: 1,
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300",
    videoUrl: "https://www.youtube.com/watch?v=t5J5sEw5Zxw",
    ingredients: [
      { name: "Eggs", quantity: 2, unit: "pcs" },
      { name: "Garlic", quantity: 10, unit: "grams" },
      { name: "Butter", quantity: 15, unit: "grams" },
    ],
    steps: [
      { text: "Melt butter in a pan over medium heat.", startTime: 10 },
      { text: "Add minced garlic and sauté until golden.", startTime: 30 },
      { text: "Crack eggs in and fry in the fragrant garlic butter.", startTime: 60 }
    ],
    status: "published"
  },
  {
    name: "Rice Pudding (Simple)",
    description: "A comforting sweet treat from pantry basics.",
    cuisine: "Universal",
    diet: "Vegetarian",
    prepMinutes: 30,
    calories: 320,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1603133872878-085e12da636c?q=80&w=300",
    videoUrl: "https://www.youtube.com/watch?v=mHn1mN7z5uY",
    ingredients: [
      { name: "Rice", quantity: 100, unit: "grams" },
      { name: "Milk", quantity: 500, unit: "ml" },
      { name: "Sugar", quantity: 3, unit: "tbsp" },
      { name: "Butter", quantity: 10, unit: "grams" },
    ],
    steps: [
      { text: "Simmer rice in milk on low heat, stirring often.", startTime: 20 },
      { text: "Add sugar and butter, stir to combine.", startTime: 90 },
      { text: "Continue cooking until thick and creamy.", startTime: 150 },
      { text: "Serve warm, garnished with a pinch of cinnamon.", startTime: 240 }
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

const badNames = [
  "Translated Bread Recipe",
  "Arts & Crafts Lunch",
  "Ghost Favorite Dish",
  "Kit Restock Fridge",
  "Romantic Meals For Two",
  "20-Min 3-Course Meal"
];

async function sync() {
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

    // 1. Deletion
    console.log("Removing placeholder non-dish recipes...");
    const delResult = await Recipe.deleteMany({ name: { $in: badNames } });
    console.log(`Deleted ${delResult.deletedCount} placeholder recipes.`);

    // 2. Seeding (Upsert logic to avoid duplicates)
    console.log("Syncing 22 featured recipes...");
    const allIngs = await Ingredient.find({});
    const ingMap = new Map(allIngs.map(i => [i.name.toLowerCase(), i._id]));

    let syncedCount = 0;
    for (const r of recipesToSync) {
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

      await Recipe.findOneAndUpdate(
        { name: r.name },
        { ...r, ingredients: ings, status: "published" },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    console.log(`Synchronized ${syncedCount} featured recipes successfully!`);
    process.exit(0);
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
}

sync();
