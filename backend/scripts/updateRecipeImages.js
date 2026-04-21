/**
 * Maintenance Script: Bulk Recipe Image Overhaul
 * replaces placeholder/repeated images with unique, high-quality food photography.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('../src/models/Recipe');

const imageMap = {
  "Authentic Roman Carbonara": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=1200&q=80",
  "Hearty Mushroom Risotto": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=1200&q=80",
  "Pan-Seared Salmon with Lemon Herb Butter": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=80",
  "Thai Green Curry with Basil": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=1200&q=80",
  "Classic Beef Wellington": "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&q=80",
  "Moong Dal Chilla (Savory Crepes)": "https://images.unsplash.com/photo-1601050690597-df056fb1ce24?w=1200&q=80",
  "Classic Pancakes": "https://images.unsplash.com/photo-1554520735-0a3b8b758b46?w=1200&q=80",
  "Lemon Garlic Chicken": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200&q=80",
  "Simple Egg Fried Rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=1200&q=80",
  "Pasta Pomodoro": "https://images.unsplash.com/photo-1506084868230-bb9d35c2438c?w=1200&q=80",
  "Quick Avocado Toast": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=80",
  "Baked Salmon": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=80",
  "Tomato Basil Soup": "https://images.unsplash.com/photo-1547592110-8034e312bc5b?w=1200&q=80",
  "Grilled Cheese": "https://images.unsplash.com/photo-1528733918455-5a59687cedf0?w=1200&q=80",
  "Oatmeal with Honey": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=1200&q=80",
  "Beef Stir Fry": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&q=80",
  "Chicken Salad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80",
  "Caprese Salad": "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=1200&q=80",
  "Egg Drop Soup": "https://images.unsplash.com/photo-1603533866308-306d860e3f73?w=1200&q=80",
  "Garlic Butter Shrimp": "https://images.unsplash.com/photo-1559742811-822873691df8?w=1200&q=80",
  "Banana Smoothie": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=1200&q=80",
  "Roasted Potatoes": "https://images.unsplash.com/photo-1518977676601-b53f02bad675?w=1200&q=80",
  "Basic Omelette": "https://images.unsplash.com/photo-1510629954389-c1e0da47d4ec?w=1200&q=80",
  "Mac and Cheese": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1200&q=80",
  "Mashed Sweet Potatoes": "https://images.unsplash.com/photo-1594911775166-491b72740df0?w=1200&q=80",
  "Bacon and Eggs": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&q=80",
  "Tuna Salad": "https://images.unsplash.com/photo-1540713434306-58fdb6cd173b?w=1200&q=80",
  "Pork Chops": "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80",
  "Peanut Butter Toast": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=80",
  "Chicken Tacos": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80",
  "Quesadilla": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&q=80",
  "Garlic Bread": "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=1200&q=80",
  "Yogurt Parfait": "https://images.unsplash.com/photo-1505253149613-112d21d9f6a9?w=1200&q=80",
  "Teriyaki Chicken": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=1200&q=80",
  "French Toast": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1200&q=80",
  "Fruit Salad": "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=1200&q=80",
  "Steak House Potatoes": "https://images.unsplash.com/photo-1518013391915-e443598460b0?w=1200&q=80",
  "Simple Turkey Sandwich": "https://images.unsplash.com/photo-1528733380117-c2d44986a593?w=1200&q=80",
  "Sausage and Peppers": "https://images.unsplash.com/photo-1541529086526-db283c563270?w=1200&q=80",
  "Basic Corn on the Cob": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=1200&q=80",
  "Baked Chicken Thighs": "https://images.unsplash.com/photo-1598514983318-2914a9447e52?w=1200&q=80",
  "Hummus with Toast": "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=1200&q=80",
  "Fish Tacos": "https://images.unsplash.com/photo-1512838243191-e81e8f66f1fd?w=1200&q=80",
  "Hard Boiled Eggs": "https://images.unsplash.com/photo-1587411768535-ee3788b39281?w=1200&q=80",
  "Cheese and Crackers": "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=1200&q=80",
  "Vegetable Soup": "https://images.unsplash.com/photo-1547592166-83ac45744acd?w=1200&q=80",
  "Creamy Butter Chicken": "https://images.unsplash.com/photo-1603894541476-eb3694086e3f?w=1200&q=80",
  "Chicken Tikka Masala": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1200&q=80",
  "Vegetable Biryani": "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=1200&q=80",
  "Saag Paneer": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1200&q=80",
  "Egg Salad": "https://images.unsplash.com/photo-1590532297129-9e8a55ed996c?w=1200&q=80",
  "Pita and Hummus": "https://images.unsplash.com/photo-1598514983318-2914a9447e52?w=1200&q=80",
  "Broccoli Scramble": "https://images.unsplash.com/photo-1540713434306-58fdb6cd173b?w=1200&q=80",
  "Cucumber Salad": "https://images.unsplash.com/photo-1621510456681-23a23d92f597?w=1200&q=80",
  "Roast Beef Slices": "https://images.unsplash.com/photo-1594911775166-491b72740df0?w=1200&q=80",
  "Sweet Potato Fries": "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=1200&q=80",
  "Easy Red Lentil Dal": "https://images.unsplash.com/photo-1546833999-b9f187311746?w=1200&q=80",
  "Slow Cooker Lamb Curry": "https://images.unsplash.com/photo-1589187151032-1726bb46d296?w=1200&q=80",
  "Egg Drop Soup with Greens": "https://images.unsplash.com/photo-1603533866308-306d860e3f73?w=1200&q=80",
  "Spinach & Tomato Frittata": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
  "Healthy Huevos Rancheros": "https://images.unsplash.com/photo-1600322214409-cf814670cd83?w=1200&q=80",
  "Bhindi Masala": "https://images.unsplash.com/photo-1601050690597-df056fb1ce24?w=1200&q=80",
  "Tofu & Broccoli Stir-Fry": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80",
  "Whole Wheat Spaghetti Bolognese": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=1200&q=80",
  "Turkey Taco Bowl": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1200&q=80",
  "Tandoori Style Grilled Chicken": "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2d?w=1200&q=80",
  "Steamed Fish with Scallions": "https://images.unsplash.com/photo-1541529086526-db283c563270?w=1200&q=80",
  "Lemon Herb Grilled Chicken": "https://images.unsplash.com/photo-1621510456681-23a23d92f597?w=1200&q=80",
  "Vegetarian Zucchini Boats": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80",
  "Avocado Toast with Egg": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=80",
  "Quick Spaghetti Pomodoro": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&q=80",
  "Simple Chicken Stir-fry": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&q=80",
  "Pizza Homemade": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80",
  "Spaghetti Aglio e Olio": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=1200&q=80",
  "Mushroom Stir Fry": "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=1200&q=80"
};

async function updateImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    let updatedCount = 0;
    for (const [name, url] of Object.entries(imageMap)) {
      const result = await Recipe.updateMany(
        { name: name },
        { $set: { imageUrl: url } }
      );
      if (result.modifiedCount > 0) {
        updatedCount += result.modifiedCount;
        console.log(`Updated: ${name}`);
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} recipes!`);
    process.exit(0);
  } catch (err) {
    console.error("Update failed:", err);
    process.exit(1);
  }
}

updateImages();
