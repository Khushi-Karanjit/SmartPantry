// backend/scripts/seed50SimpleRecipes.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");
const { calculateRecipeMacros } = require("../src/services/nutrition.service");

// Helper to keep formatting clean
const makeRecipe = (name, desc, cuisine, diet, imageUrl, prep, servings, mealType, ingredients, stepStrings) => ({
  name, description: desc, cuisine, diet, imageUrl, prepMinutes: prep, servings, mealType,
  ingredients,
  steps: stepStrings.map((t, i) => ({ text: t, startTime: i * 60 }))
});

const data = [
  // 1-10 (The Classics)
  makeRecipe("Classic Pancakes", "Fluffy simple morning pancakes.", "American", "Vegetarian", "https://images.unsplash.com/photo-1598514982205-f36b96d1ea8d?w=800", 10, 2, "breakfast", 
    [{ name: "Flour", quantity: 1, unit: "cup" }, { name: "Milk", quantity: 1, unit: "cup" }, { name: "Egg", quantity: 1, unit: "pcs" }, { name: "Butter", quantity: 2, unit: "tbsp" }, { name: "Sugar", quantity: 1, unit: "tbsp" }],
    ["Crack egg into bowl.", "Pour milk and whisk.", "Melt butter into wet mix.", "Fold in flour cautiously.", "Heat skillet over medium.", "Pour batter in circles.", "Cook until bubbles form.", "Flip and finish cooking."]
  ),
  makeRecipe("Lemon Garlic Chicken", "Bright pan-seared chicken.", "Mediterranean", "High Protein", "https://images.unsplash.com/photo-1598515322627-90cb8b525208?w=800", 15, 2, "dinner", 
    [{ name: "Chicken Breast", quantity: 2, unit: "pcs" }, { name: "Garlic", quantity: 3, unit: "cloves" }, { name: "Lemon", quantity: 1, unit: "pcs" }, { name: "Olive Oil", quantity: 2, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tsp" }],
    ["Pat chicken dry.", "Season heavily with salt.", "Mince garlic.", "Heat olive oil in pan.", "Sear chicken 5 minutes.", "Flip chicken over.", "Squeeze lemon directly on meat.", "Add garlic until fragrant."]
  ),
  makeRecipe("Simple Egg Fried Rice", "Quick prep leftover rice.", "Chinese", "Balanced", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800", 15, 2, "lunch", 
    [{ name: "Cooked Rice", quantity: 3, unit: "cups" }, { name: "Egg", quantity: 2, unit: "pcs" }, { name: "Soy Sauce", quantity: 2, unit: "tbsp" }, { name: "Green Onion", quantity: 2, unit: "pcs" }, { name: "Oil", quantity: 1, unit: "tbsp" }],
    ["Slice green onions.", "Lightly beat eggs.", "Heat oil in wok.", "Scramble eggs quickly.", "Add cold rice.", "Break clumps of rice.", "Drizzle soy sauce.", "Toss until uniform.", "Garnish with onions."]
  ),
  makeRecipe("Pasta Pomodoro", "Fast Italian classic.", "Italian", "Vegetarian", "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800", 20, 2, "dinner", 
    [{ name: "Pasta", quantity: 200, unit: "g" }, { name: "Tomato", quantity: 3, unit: "pcs" }, { name: "Olive Oil", quantity: 3, unit: "tbsp" }, { name: "Garlic", quantity: 2, unit: "cloves" }, { name: "Salt", quantity: 1, unit: "tbsp" }],
    ["Boil salted water.", "Drop pasta to cook.", "Mince the garlic.", "Heat oil gently.", "Cook garlic until golden.", "Chop and stir in tomatoes.", "Add a splash of pasta water.", "Toss pasta in the sauce."]
  ),
  makeRecipe("Quick Avocado Toast", "Creamy avocado on toast.", "American", "Vegan", "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800", 5, 1, "breakfast", 
    [{ name: "Bread", quantity: 2, unit: "slices" }, { name: "Avocado", quantity: 1, unit: "pcs" }, { name: "Lemon", quantity: 0.5, unit: "pcs" }, { name: "Salt", quantity: 0.5, unit: "tsp" }],
    ["Toast bread slices.", "Remove avocado pit.", "Scoop flesh into bowl.", "Squeeze lemon juice over it.", "Mash smoothly.", "Spread onto toast.", "Add pinch of salt."]
  ),
  makeRecipe("Baked Salmon", "Healthy weeknight salmon.", "American", "Pescatarian", "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800", 20, 2, "dinner", 
    [{ name: "Salmon", quantity: 2, unit: "pcs" }, { name: "Olive Oil", quantity: 1, unit: "tbsp" }, { name: "Lemon", quantity: 1, unit: "pcs" }, { name: "Salt", quantity: 1, unit: "tsp" }],
    ["Preheat oven to 400F.", "Place salmon on tray.", "Drizzle with oil.", "Season with salt.", "Top with lemon slices.", "Bake for 12 minutes."]
  ),
  makeRecipe("Tomato Basil Soup", "Comforting homemade soup.", "Italian", "Vegetarian", "https://images.unsplash.com/photo-1547592180-85f173990554?w=800", 30, 4, "lunch", 
    [{ name: "Tomato", quantity: 8, unit: "pcs" }, { name: "Onion", quantity: 1, unit: "pcs" }, { name: "Garlic", quantity: 3, unit: "cloves" }, { name: "Olive Oil", quantity: 2, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tsp" }],
    ["Chop tomatoes and onion.", "Heat oil in pot.", "Sauté onion.", "Add garlic.", "Stir in tomatoes.", "Simmer for 20 mins.", "Blend until smooth."]
  ),
  makeRecipe("Grilled Cheese", "Crispy gooey center.", "American", "Vegetarian", "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800", 10, 1, "snack", 
    [{ name: "Bread", quantity: 2, unit: "slices" }, { name: "Cheese", quantity: 2, unit: "slices" }, { name: "Butter", quantity: 1, unit: "tbsp" }],
    ["Heat skillet.", "Butter one side of bread.", "Place bread butter-down.", "Layer cheese on top.", "Place second bread slice.", "Cook 3 minutes.", "Carefully flip.", "Cook until cheese melts."]
  ),
  makeRecipe("Oatmeal with Honey", "Nourishing warm oats.", "American", "Vegetarian", "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800", 5, 1, "breakfast", 
    [{ name: "Oats", quantity: 0.5, unit: "cup" }, { name: "Milk", quantity: 1, unit: "cup" }, { name: "Banana", quantity: 1, unit: "pcs" }, { name: "Honey", quantity: 1, unit: "tbsp" }],
    ["Pour oats and milk in pan.", "Bring to gentle bubble.", "Stir for 3 minutes.", "Transfer to bowl.", "Slice banana.", "Arrange on top.", "Drizzle with honey."]
  ),
  makeRecipe("Beef Stir Fry", "High-protein savory staple.", "Chinese", "High Protein", "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800", 15, 2, "dinner", 
    [{ name: "Beef", quantity: 250, unit: "g" }, { name: "Soy Sauce", quantity: 2, unit: "tbsp" }, { name: "Garlic", quantity: 2, unit: "cloves" }, { name: "Mushroom", quantity: 1, unit: "cup" }, { name: "Oil", quantity: 1, unit: "tbsp" }],
    ["Slice beef very thinly.", "Mince garlic.", "Slice mushrooms.", "Heat wok very hot.", "Sear beef 1 minute.", "Add vegetables.", "Toss 2 minutes.", "Stir in soy sauce."]
  ),

  // 11-20
  makeRecipe("Chicken Salad", "Crisp simple protein salad.", "American", "High Protein", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", 10, 2, "lunch",
    [{ name: "Chicken Breast", quantity: 1, unit: "pcs" }, { name: "Mayonnaise", quantity: 2, unit: "tbsp" }, { name: "Celery", quantity: 1, unit: "pcs" }, { name: "Salt", quantity: 0.5, unit: "tsp" }],
    ["Boil or cook chicken.", "Shred meat with forks.", "Chop celery finely.", "Mix mayo into chicken.", "Stir in celery.", "Season with salt."]
  ),
  makeRecipe("Caprese Salad", "Fresh mozzarella and tomatoes.", "Italian", "Vegetarian", "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800", 5, 2, "lunch",
    [{ name: "Tomato", quantity: 2, unit: "pcs" }, { name: "Cheese", quantity: 100, unit: "g" }, { name: "Olive Oil", quantity: 1, unit: "tbsp" }],
    ["Slice tomatoes evenly.", "Slice mozzarella cheese.", "Layer alternating on a plate.", "Drizzle with olive oil.", "Sprinkle salt over top."]
  ),
  makeRecipe("Egg Drop Soup", "Warm savory broth.", "Chinese", "Balanced", "https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=800", 10, 2, "lunch",
    [{ name: "Chicken Broth", quantity: 2, unit: "cups" }, { name: "Egg", quantity: 2, unit: "pcs" }, { name: "Green Onion", quantity: 1, unit: "pcs" }, { name: "Soy Sauce", quantity: 1, unit: "tbsp" }],
    ["Bring broth to boil.", "Beat eggs in a bowl.", "Stir boiling broth in circles.", "Slowly pour in eggs.", "Remove from heat.", "Garnish with onion."]
  ),
  makeRecipe("Garlic Butter Shrimp", "Fast seared seafood.", "American", "Pescatarian", "https://images.unsplash.com/photo-1559742811-822873691df8?w=800", 10, 2, "dinner",
    [{ name: "Shrimp", quantity: 300, unit: "g" }, { name: "Butter", quantity: 2, unit: "tbsp" }, { name: "Garlic", quantity: 3, unit: "cloves" }, { name: "Lemon", quantity: 0.5, unit: "pcs" }],
    ["Peel and clean shrimp.", "Mince the garlic.", "Melt butter in a pan.", "Add garlic gently.", "Cook shrimp 2 minutes.", "Flip and finish.", "Squeeze lemon juice."]
  ),
  makeRecipe("Banana Smoothie", "Quick liquid breakfast.", "American", "Vegetarian", "https://images.unsplash.com/photo-1553530666-ba11a918a280?w=800", 5, 1, "breakfast",
    [{ name: "Banana", quantity: 1, unit: "pcs" }, { name: "Milk", quantity: 1, unit: "cup" }, { name: "Honey", quantity: 1, unit: "tbsp" }, { name: "Yogurt", quantity: 0.5, unit: "cup" }],
    ["Peel the banana.", "Break into blender.", "Pour in the milk.", "Add yogurt.", "Squeeze honey in.", "Blend until incredibly smooth."]
  ),
  makeRecipe("Roasted Potatoes", "Crispy seasoned carbs.", "American", "Vegan", "https://images.unsplash.com/photo-1596645391264-b863aaedce2a?w=800", 35, 4, "dinner",
    [{ name: "Potato", quantity: 4, unit: "pcs" }, { name: "Olive Oil", quantity: 2, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tsp" }, { name: "Garlic", quantity: 2, unit: "cloves" }],
    ["Preheat oven to 425F.", "Wash and cube potatoes.", "Toss firmly with olive oil.", "Mince garlic and add.", "Spread on baking sheet.", "Roast for 30 mins."]
  ),
  makeRecipe("Basic Omelette", "Classic folded eggs.", "French", "Vegetarian", "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800", 8, 1, "breakfast",
    [{ name: "Egg", quantity: 3, unit: "pcs" }, { name: "Butter", quantity: 1, unit: "tbsp" }, { name: "Cheese", quantity: 1, unit: "slice" }, { name: "Salt", quantity: 0.5, unit: "tsp" }],
    ["Crack eggs into a bowl.", "Whisk vigorously.", "Melt butter in skillet.", "Pour eggs evenly.", "Cook until edges set.", "Add cheese to center.", "Fold in half respectfully.", "Serve immediately."]
  ),
  makeRecipe("Mac and Cheese", "Creamy stovetop comfort.", "American", "Vegetarian", "https://images.unsplash.com/photo-1543339494-b4cd4f7ba68e?w=800", 15, 2, "dinner",
    [{ name: "Pasta", quantity: 200, unit: "g" }, { name: "Milk", quantity: 0.5, unit: "cup" }, { name: "Cheese", quantity: 1, unit: "cup" }, { name: "Butter", quantity: 1, unit: "tbsp" }],
    ["Boil pasta in water.", "Drain pasta entirely.", "Return pasta to pot.", "Add milk and butter.", "Stir globally over low heat.", "Mix in grated cheese steadily."]
  ),
  makeRecipe("Mashed Sweet Potatoes", "Sweet and savory side.", "American", "Vegetarian", "https://images.unsplash.com/photo-1601053155160-f00e00f9157a?w=800", 25, 3, "dinner",
    [{ name: "Sweet Potato", quantity: 3, unit: "pcs" }, { name: "Butter", quantity: 2, unit: "tbsp" }, { name: "Milk", quantity: 0.25, unit: "cup" }, { name: "Salt", quantity: 0.5, unit: "tsp" }],
    ["Peel the sweet potatoes.", "Chop into large chunks.", "Boil gently until tender.", "Drain water thoroughly.", "Add butter and milk.", "Mash until purely smooth."]
  ),
  makeRecipe("Bacon and Eggs", "The standard diner plate.", "American", "High Protein", "https://images.unsplash.com/photo-1606331908064-07dcc264b4c7?w=800", 10, 1, "breakfast",
    [{ name: "Bacon", quantity: 3, unit: "slices" }, { name: "Egg", quantity: 2, unit: "pcs" }, { name: "Salt", quantity: 0.5, unit: "tsp" }],
    ["Place bacon in cold skillet.", "Turn heat to medium.", "Cook bacon crisp.", "Transfer bacon to paper towel.", "Leave the bacon fat in pan.", "Fry eggs in the fat.", "Serve together hot."]
  ),

  // 21-30
  makeRecipe("Tuna Salad", "Protein-packed snack.", "American", "Pescatarian", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", 5, 2, "lunch",
    [{ name: "Tuna", quantity: 1, unit: "can" }, { name: "Mayonnaise", quantity: 2, unit: "tbsp" }, { name: "Lemon", quantity: 0.5, unit: "pcs" }],
    ["Drain water from tuna can.", "Empty tuna into small bowl.", "Add mayonnaise cleanly.", "Squeeze lemon directly in.", "Mix aggressively with fork."]
  ),
  makeRecipe("Pork Chops", "Simple pan seared pork.", "American", "High Protein", "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800", 15, 2, "dinner",
    [{ name: "Pork Chop", quantity: 2, unit: "pcs" }, { name: "Olive Oil", quantity: 1, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tsp" }, { name: "Garlic", quantity: 2, unit: "cloves" }],
    ["Season chops with salt.", "Mince garlic.", "Heat oil heavily.", "Place chops in pan.", "Cook for 5 minutes.", "Flip chops securely.", "Add garlic.", "Cook until safely done."]
  ),
  makeRecipe("Peanut Butter Toast", "Fast energy breakfast.", "American", "Vegan", "https://images.unsplash.com/photo-1619623694002-c8fa62bb2b82?w=800", 5, 1, "breakfast",
    [{ name: "Bread", quantity: 2, unit: "slices" }, { name: "Peanut Butter", quantity: 2, unit: "tbsp" }, { name: "Banana", quantity: 1, unit: "pcs" }],
    ["Place bread in toaster.", "Wait for toast.", "Slice banana thinly.", "Spread peanut butter.", "Layer banana safely on top."]
  ),
  makeRecipe("Chicken Tacos", "Easy Mexican street style.", "Mexican", "Balanced", "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800", 20, 2, "dinner",
    [{ name: "Chicken Breast", quantity: 2, unit: "pcs" }, { name: "Tortilla", quantity: 4, unit: "pcs" }, { name: "Onion", quantity: 0.5, unit: "pcs" }, { name: "Tomato", quantity: 1, unit: "pcs" }],
    ["Grill the chicken entirely.", "Dice the chicken meats.", "Chop the onion finely.", "Dice the tomato cleanly.", "Warm the tortillas.", "Fill tortillas with chicken.", "Top with vegetables."]
  ),
  makeRecipe("Quesadilla", "Melted cheese in tortilla.", "Mexican", "Vegetarian", "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800", 10, 1, "lunch",
    [{ name: "Tortilla", quantity: 2, unit: "pcs" }, { name: "Cheese", quantity: 1, unit: "cup" }, { name: "Butter", quantity: 1, unit: "tbsp" }],
    ["Place butter in pan.", "Lay down one tortilla.", "Scatter cheese over it.", "Cover with second tortilla.", "Cook until bottom is brown.", "Flip carefully.", "Wait for cheese melt."]
  ),
  makeRecipe("Garlic Bread", "Crispy savory side.", "Italian", "Vegetarian", "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800", 15, 4, "snack",
    [{ name: "Bread", quantity: 1, unit: "loaf" }, { name: "Butter", quantity: 4, unit: "tbsp" }, { name: "Garlic", quantity: 4, unit: "cloves" }],
    ["Preheat oven deeply.", "Slice the bread horizontally.", "Mince garlic tightly.", "Mix garlic into butter.", "Spread mixture intensely on bread.", "Bake for 10 minutes."]
  ),
  makeRecipe("Yogurt Parfait", "Layered healthy breakfast.", "American", "Vegetarian", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800", 5, 1, "breakfast",
    [{ name: "Yogurt", quantity: 1, unit: "cup" }, { name: "Oats", quantity: 0.25, unit: "cup" }, { name: "Honey", quantity: 1, unit: "tbsp" }],
    ["Take a tall glass.", "Spoon yogurt into the base.", "Add an oat layer.", "Spoon more yogurt on top.", "Drizzle the honey strictly."]
  ),
  makeRecipe("Teriyaki Chicken", "Sweet soy glazed chicken.", "Japanese", "High Protein", "https://images.unsplash.com/photo-1598514982631-f9b8c0e2a225?w=800", 25, 2, "dinner",
    [{ name: "Chicken Breast", quantity: 2, unit: "pcs" }, { name: "Soy Sauce", quantity: 3, unit: "tbsp" }, { name: "Sugar", quantity: 2, unit: "tbsp" }, { name: "Garlic", quantity: 1, unit: "cloves" }],
    ["Cube the chicken.", "Mince the garlic quickly.", "Mix soy sauce, sugar, garlic.", "Cook chicken in pan.", "Pour sauce evenly over it.", "Simmer until sauce thickens."]
  ),
  makeRecipe("French Toast", "Sweet egg-soaked bread.", "French", "Vegetarian", "https://images.unsplash.com/photo-1484723091792-c151cb6002f5?w=800", 15, 2, "breakfast",
    [{ name: "Bread", quantity: 4, unit: "slices" }, { name: "Egg", quantity: 2, unit: "pcs" }, { name: "Milk", quantity: 0.5, unit: "cup" }, { name: "Butter", quantity: 1, unit: "tbsp" }],
    ["Whisk eggs and milk steadily.", "Soak bread in the mixture.", "Melt butter safely in a pan.", "Cook bread slices firmly.", "Flip once golden.", "Cook opposite side gently."]
  ),
  makeRecipe("Fruit Salad", "Quick chopped refreshing mix.", "Global", "Vegan", "https://images.unsplash.com/photo-1519996521430-0287e4c3fb66?w=800", 10, 4, "snack",
    [{ name: "Banana", quantity: 2, unit: "pcs" }, { name: "Apple", quantity: 2, unit: "pcs" }, { name: "Lemon", quantity: 0.5, unit: "pcs" }],
    ["Peel the bananas safely.", "Slice all bananas accurately.", "Dice the apples fully.", "Toss together in a bowl.", "Squeeze lemon juice broadly to stop browning."]
  ),

  // 31-40
  makeRecipe("Steak House Potatoes", "Thick roasted potato wedges.", "American", "Vegan", "https://images.unsplash.com/photo-1505253713661-d70377ee1280?w=800", 40, 4, "dinner",
    [{ name: "Potato", quantity: 4, unit: "pcs" }, { name: "Olive Oil", quantity: 2, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tbsp" }, { name: "Pepper", quantity: 1, unit: "tsp" }],
    ["Preheat the main oven to 450F.", "Slice potatoes into fat wedges.", "Coat utterly with oil.", "Season loudly with salt/pepper.", "Bake efficiently for 35 mins."]
  ),
  makeRecipe("Simple Turkey Sandwich", "Lunchbox staple.", "American", "Balanced", "https://images.unsplash.com/photo-1616031037016-163e7786baef?w=800", 5, 1, "lunch",
    [{ name: "Bread", quantity: 2, unit: "slices" }, { name: "Turkey", quantity: 3, unit: "slices" }, { name: "Cheese", quantity: 1, unit: "slice" }, { name: "Mayonnaise", quantity: 1, unit: "tbsp" }],
    ["Lay bread precisely flat.", "Spread mayo universally on one piece.", "Layer turkey calmly.", "Place cheese on top.", "Seal the sandwich neatly."]
  ),
  makeRecipe("Sausage and Peppers", "Pan cooked savory links.", "Italian", "High Protein", "https://images.unsplash.com/photo-1601358999388-66af7010f438?w=800", 25, 3, "dinner",
    [{ name: "Sausage", quantity: 3, unit: "pcs" }, { name: "Bell Pepper", quantity: 2, unit: "pcs" }, { name: "Onion", quantity: 1, unit: "pcs" }, { name: "Olive Oil", quantity: 1, unit: "tbsp" }],
    ["Slice the sausages.", "Slice peppers aggressively.", "Chop onions simply.", "Sauté sausages in oil.", "Remove sausage, cook veggies.", "Combine and simmer."]
  ),
  makeRecipe("Basic Corn on the Cob", "Boiled buttery summer crop.", "American", "Vegetarian", "https://images.unsplash.com/photo-1608797178974-15b3060fc180?w=800", 15, 2, "snack",
    [{ name: "Corn", quantity: 2, unit: "pcs" }, { name: "Butter", quantity: 2, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tsp" }],
    ["Shuck the corn thoroughly.", "Boil a large pot intensely.", "Submerge the corn totally.", "Boil gently for 8 minutes.", "Remove securely.", "Rub aggressively with butter."]
  ),
  makeRecipe("Baked Chicken Thighs", "Juicy roasted poultry.", "American", "High Protein", "https://images.unsplash.com/photo-1598514981881-22b64d0dd2e7?w=800", 35, 2, "dinner",
    [{ name: "Chicken Thigh", quantity: 2, unit: "pcs" }, { name: "Olive Oil", quantity: 1, unit: "tbsp" }, { name: "Garlic", quantity: 1, unit: "cloves" }, { name: "Salt", quantity: 1, unit: "tsp" }],
    ["Heat oven to 400F.", "Rub thighs generously with oil.", "Mince garlic finely.", "Coat thighs with garlic/salt.", "Bake decisively for 30 minutes."]
  ),
  makeRecipe("Hummus with Toast", "Creamy savory appetizer.", "Mediterranean", "Vegan", "https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=800", 5, 2, "snack",
    [{ name: "Hummus", quantity: 0.5, unit: "cup" }, { name: "Bread", quantity: 2, unit: "slices" }, { name: "Olive Oil", quantity: 1, unit: "tbsp" }],
    ["Toast the bread sharply.", "Spread hummus strictly on toast.", "Drizzle olive oil loosely on top.", "Slice the bread diagonally."]
  ),
  makeRecipe("Fish Tacos", "Crisp simple seafood shells.", "Mexican", "Pescatarian", "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800", 25, 2, "lunch",
    [{ name: "Fish", quantity: 200, unit: "g" }, { name: "Tortilla", quantity: 4, unit: "pcs" }, { name: "Lemon", quantity: 1, unit: "pcs" }, { name: "Oil", quantity: 1, unit: "tbsp" }],
    ["Slice the fish reliably.", "Pan fry in oil.", "Squeeze lemon aggressively over fish.", "Warm the tortillas silently.", "Assemble tacos."]
  ),
  makeRecipe("Hard Boiled Eggs", "The standard protein snack.", "Global", "High Protein", "https://images.unsplash.com/photo-1563805042-7684c8e9b533?w=800", 15, 2, "snack",
    [{ name: "Egg", quantity: 4, unit: "pcs" }, { name: "Salt", quantity: 0.5, unit: "tsp" }],
    ["Place eggs in cold water.", "Bring precisely to a rolling boil.", "Turn off the heat.", "Cover pot for 12 minutes.", "Move to ice water.", "Peel and salt heavily."]
  ),
  makeRecipe("Cheese and Crackers", "Simple dairy bites.", "Global", "Vegetarian", "https://images.unsplash.com/photo-1606114880590-edc076a26798?w=800", 2, 1, "snack",
    [{ name: "Cheese", quantity: 50, unit: "g" }, { name: "Crackers", quantity: 10, unit: "pcs" }],
    ["Slice the cheese squarely.", "Arrange crackers widely.", "Place cheese systematically on crackers."]
  ),
  makeRecipe("Vegetable Soup", "Clean vegetable broth.", "Global", "Vegan", "https://images.unsplash.com/photo-1547592180-85f173990554?w=800", 30, 4, "dinner",
    [{ name: "Vegetable Broth", quantity: 4, unit: "cups" }, { name: "Carrot", quantity: 2, unit: "pcs" }, { name: "Celery", quantity: 2, unit: "pcs" }, { name: "Onion", quantity: 1, unit: "pcs" }],
    ["Chop carrots completely.", "Dice onions.", "Chop celery.", "Boil the broth rapidly.", "Add all veggies.", "Simmer patiently for 20 minutes."]
  ),

  // 41-50
  makeRecipe("Scrambled Tofu", "Vegan egg alternative.", "Global", "Vegan", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", 10, 2, "breakfast",
    [{ name: "Tofu", quantity: 300, unit: "g" }, { name: "Oil", quantity: 1, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tsp" }, { name: "Pepper", quantity: 1, unit: "tsp" }],
    ["Crumble tofu with hands.", "Heat oil heavily.", "Throw tofu thoroughly into pan.", "Cook for exactly 5 minutes.", "Season with salt."]
  ),
  makeRecipe("Spaghetti Aglio e Olio", "Oil and garlic pasta.", "Italian", "Vegetarian", "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800", 15, 2, "dinner",
    [{ name: "Pasta", quantity: 200, unit: "g" }, { name: "Olive Oil", quantity: 4, unit: "tbsp" }, { name: "Garlic", quantity: 4, unit: "cloves" }, { name: "Salt", quantity: 1, unit: "tsp" }],
    ["Boil the pasta vigorously.", "Mince garlic.", "Heat oil gently.", "Fry garlic carefully.", "Drain pasta safely.", "Toss pasta intensely in oil."]
  ),
  makeRecipe("Mushroom Stir Fry", "Earthy quick side.", "Chinese", "Vegan", "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800", 10, 2, "dinner",
    [{ name: "Mushroom", quantity: 2, unit: "cups" }, { name: "Soy Sauce", quantity: 2, unit: "tbsp" }, { name: "Garlic", quantity: 2, unit: "cloves" }, { name: "Oil", quantity: 1, unit: "tbsp" }],
    ["Slice mushrooms.", "Heat wok.", "Sear mushrooms completely.", "Add garlic.", "Stir quickly.", "Pour soy sauce over mushrooms."]
  ),
  makeRecipe("Grilled Chicken Breast", "Standard fitness fuel.", "American", "High Protein", "https://images.unsplash.com/photo-1598515322627-90cb8b525208?w=800", 20, 2, "lunch",
    [{ name: "Chicken Breast", quantity: 2, unit: "pcs" }, { name: "Olive Oil", quantity: 1, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tsp" }],
    ["Rub chicken with oil.", "Season violently with salt.", "Grill 8 minutes broadly per side.", "Rest meat reliably."]
  ),
  makeRecipe("Egg Salad", "Creamy egg staple.", "American", "Vegetarian", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", 15, 2, "lunch",
    [{ name: "Egg", quantity: 4, unit: "pcs" }, { name: "Mayonnaise", quantity: 2, unit: "tbsp" }, { name: "Salt", quantity: 0.5, unit: "tsp" }],
    ["Boil eggs thoroughly.", "Cool completely in ice.", "Peel shells carefully.", "Chop eggs deeply.", "Mix furiously with mayo."]
  ),
  makeRecipe("Pita and Hummus", "Simple Mediterranean snack.", "Mediterranean", "Vegan", "https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=800", 2, 2, "snack",
    [{ name: "Pita", quantity: 2, unit: "pcs" }, { name: "Hummus", quantity: 1, unit: "cup" }],
    ["Warm the pita efficiently.", "Slice carefully into triangles.", "Serve directly with hummus."]
  ),
  makeRecipe("Broccoli Scramble", "Green protein breakfast.", "American", "Vegetarian", "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800", 12, 1, "breakfast",
    [{ name: "Broccoli", quantity: 1, unit: "cup" }, { name: "Egg", quantity: 2, unit: "pcs" }, { name: "Butter", quantity: 1, unit: "tbsp" }],
    ["Chop broccoli widely.", "Sauté broccoli in butter.", "Whisk eggs cleanly.", "Pour eggs into pan.", "Scramble everything smoothly."]
  ),
  makeRecipe("Cucumber Salad", "Crisp water-rich snack.", "Global", "Vegan", "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800", 5, 2, "snack",
    [{ name: "Cucumber", quantity: 2, unit: "pcs" }, { name: "Lemon", quantity: 0.5, unit: "pcs" }, { name: "Salt", quantity: 0.5, unit: "tsp" }],
    ["Slice cucumber thinly.", "Place heavily into bowl.", "Squeeze lemon.", "Salt evenly."]
  ),
  makeRecipe("Roast Beef Slices", "Easy deli imitation.", "American", "High Protein", "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800", 60, 6, "dinner",
    [{ name: "Beef", quantity: 500, unit: "g" }, { name: "Salt", quantity: 2, unit: "tsp" }, { name: "Pepper", quantity: 1, unit: "tsp" }],
    ["Preheat oven completely to 375F.", "Rub beef forcefully with spices.", "Roast 45 minutes.", "Rest 15 minutes before cleanly slicing."]
  ),
  makeRecipe("Sweet Potato Fries", "Orange crunchy sides.", "American", "Vegan", "https://images.unsplash.com/photo-1601053155160-f00e00f9157a?w=800", 30, 2, "snack",
    [{ name: "Sweet Potato", quantity: 2, unit: "pcs" }, { name: "Olive Oil", quantity: 2, unit: "tbsp" }, { name: "Salt", quantity: 1, unit: "tsp" }],
    ["Cut potatoes purely into strips.", "Toss absolutely with oil/salt.", "Bake vigorously at 425F for 25 mins."]
  )
];

async function seed() {
  try {
    const remoteUri = process.env.MONGO_URI;
    const localUri = "mongodb://127.0.0.1:27017/smartpantry";
    
    console.log("Attempting to connect to MongoDB...");
    try {
      if (remoteUri) await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 5000 });
      else throw new Error("No remote URI found");
    } catch (e) {
      await mongoose.connect(localUri);
    }

    console.log("Purging all recipes...");
    await Recipe.deleteMany({});
    
    const results = [];
    
    console.log("Mapping ingredients and generating robust macros for exactly 50 recipes...");
    
    // Scale up to exactly 50 unique variations
    const expandedData = [...data];
    let index = 0;
    while(expandedData.length < 50) {
      const base = data[index];
      expandedData.push({
        ...base,
        name: "Deluxe " + base.name,
        ingredients: [...base.ingredients, { name: "Butter", quantity: 1, unit: "tbsp" }]
      });
      index++;
    }

    for (const recipe of expandedData) {
      const enrichedIngredients = [];
      
      for (const ing of recipe.ingredients) {
        let match = await Ingredient.findOne({ 
          name: { $regex: new RegExp(`^${ing.name}$`, "i") } 
        });

        if (!match) {
           match = await Ingredient.findOne({ 
             $or: [
               { name: { $regex: new RegExp(ing.name, "i") } },
               { keywords: { $in: [new RegExp(ing.name, "i")] } }
             ]
           });
        }

        if (!match) {
          match = await Ingredient.create({ 
            name: ing.name, category: "Other", defaultUnit: ing.unit 
          });
        }
        
        enrichedIngredients.push({
          name: match.name,
          quantity: ing.quantity,
          unit: ing.unit,
          ingredientId: match._id
        });
      }
      
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
    console.log(`Successfully seeded ${results.length} clean recipes paired with precision macros!`);
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
