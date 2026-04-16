const mongoose = require("mongoose");
require("dotenv").config();
const PantryPreset = require("../src/models/PantryPreset");

const presets = [
  {
    key: "bakery",
    title: "Artisan Bakery 🧁",
    description: "The foundations for bread, cakes, and gourmet pastries.",
    items: [
      { name: "Bread Flour", category: "Grains", quantity: 2, unit: "kg" },
      { name: "Granulated Sugar", category: "Other", quantity: 1, unit: "kg" },
      { name: "Active Dry Yeast", category: "Bakery", quantity: 50, unit: "grams" },
      { name: "Cocoa Powder", category: "Bakery", quantity: 200, unit: "grams" },
      { name: "Vanilla Extract", category: "Condiments", quantity: 50, unit: "ml" },
      { name: "Baking Powder", category: "Other", quantity: 100, unit: "grams" },
      { name: "Sea Salt", category: "Spices", quantity: 200, unit: "grams" },
      { name: "Whole Milk", category: "Dairy", quantity: 1, unit: "liter" },
      { name: "Large Eggs", category: "Dairy", quantity: 12, unit: "pcs" },
      { name: "Unsalted Butter", category: "Dairy", quantity: 500, unit: "grams" }
    ]
  },
  {
    key: "spices",
    title: "The Spice Alchemist 🌶️",
    description: "High-grade flavor foundations for global and local dishes.",
    items: [
      { name: "Cardamom", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Cinnamon", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Timur (Himalayan Pepper)", category: "Spices", quantity: 30, unit: "grams" },
      { name: "Turmeric", category: "Spices", quantity: 100, unit: "grams" },
      { name: "Cumin Seeds", category: "Spices", quantity: 100, unit: "grams" },
      { name: "Cloves", category: "Spices", quantity: 30, unit: "grams" },
      { name: "Star Anise", category: "Spices", quantity: 20, unit: "grams" },
      { name: "Paprika", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Garlic Powder", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Dried Oregano", category: "Spices", quantity: 30, unit: "grams" },
      { name: "Chili Flakes", category: "Spices", quantity: 100, unit: "grams" }
    ]
  },
  {
    key: "himalayan",
    title: "Himalayan Gourmet 🏔️",
    description: "Authentic, high-altitude treasures from the heart of Nepal.",
    items: [
      { name: "Jimbu", category: "Spices", quantity: 20, unit: "grams" },
      { name: "Gundruk", category: "Vegetables", quantity: 200, unit: "grams" },
      { name: "Chiura (Beaten Rice)", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Yak Cheese", category: "Dairy", quantity: 250, unit: "grams" },
      { name: "Ghee", category: "Dairy", quantity: 500, unit: "ml" },
      { name: "Himalayan Pink Salt", category: "Spices", quantity: 1, unit: "kg" },
      { name: "Mustang Beans", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Buckwheat Flour (Phapar)", category: "Grains", quantity: 500, unit: "grams" },
      { name: "Himalayan Wild Honey", category: "Other", quantity: 250, unit: "grams" }
    ]
  },
  {
    key: "fusion",
    title: "Asian Fusion Night 🍜",
    description: "Umami-rich essentials for premium stir-fries and ramen.",
    items: [
      { name: "Miso Paste", category: "Condiments", quantity: 250, unit: "grams" },
      { name: "Gochujang", category: "Condiments", quantity: 200, unit: "grams" },
      { name: "Sushi Rice", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Nori Sheets", category: "Other", quantity: 10, unit: "pcs" },
      { name: "Sesame Oil", category: "Oils", quantity: 250, unit: "ml" },
      { name: "Bok Choy", category: "Vegetables", quantity: 3, unit: "pcs" },
      { name: "Sriracha", category: "Condiments", quantity: 400, unit: "ml" },
      { name: "Soy Sauce", category: "Condiments", quantity: 500, unit: "ml" },
      { name: "Rice Vinegar", category: "Condiments", quantity: 250, unit: "ml" },
      { name: "Fresh Ginger", category: "Vegetables", quantity: 100, unit: "grams" }
    ]
  },
  {
    key: "barista",
    title: "The Barista Studio ☕",
    description: "Elevate your morning with cafe-grade brewing essentials.",
    items: [
      { name: "Specialty Coffee Beans", category: "Other", quantity: 500, unit: "grams" },
      { name: "Oat Milk", category: "Dairy", quantity: 1, unit: "liter" },
      { name: "Vanilla Syrup", category: "Condiments", quantity: 250, unit: "ml" },
      { name: "Matcha Powder", category: "Other", quantity: 50, unit: "grams" },
      { name: "Artisan Honey", category: "Other", quantity: 300, unit: "grams" },
      { name: "Cocoa Nibs", category: "Snacks", quantity: 100, unit: "grams" }
    ]
  },
  {
    key: "italian",
    title: "Italian Festa 🍝",
    description: "Authentic Mediterranean flavors for gourmet pasta nights.",
    items: [
      { name: "Truffle Oil", category: "Oils", quantity: 100, unit: "ml" },
      { name: "Balsamic Glaze", category: "Condiments", quantity: 250, unit: "ml" },
      { name: "San Marzano Tomatoes", category: "Canned Goods", quantity: 2, unit: "cans" },
      { name: "Pine Nuts", category: "Snacks", quantity: 50, unit: "grams" },
      { name: "Kalamata Olives", category: "Canned Goods", quantity: 200, unit: "grams" },
      { name: "Dried Oregano", category: "Spices", quantity: 30, unit: "grams" }
    ]
  },
  {
    key: "gym",
    title: "Gym Warrior 🏋️",
    description: "High-density protein and complex fuel for meal-prepping.",
    items: [
      { name: "Egg Whites", category: "Dairy", quantity: 1, unit: "liter" },
      { name: "Quinoa", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Whey Protein Isolate", category: "Other", quantity: 500, unit: "grams" },
      { name: "Organic Peanut Butter", category: "Snacks", quantity: 500, unit: "grams" },
      { name: "Fresh Spinach", category: "Vegetables", quantity: 200, unit: "grams" },
      { name: "Chia Seeds", category: "Other", quantity: 200, unit: "grams" },
      { name: "Greek Yogurt", category: "Dairy", quantity: 500, unit: "grams" }
    ]
  },
  {
    key: "nepali-staples",
    title: "Nepali Kitchen Essentials 🇳🇵",
    description: "Daily staples for the perfect Dal-Bhat-Tarkari experience.",
    items: [
      { name: "Basmati Rice", category: "Grains", quantity: 2, unit: "kg" },
      { name: "Red Lentils (Musuro)", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Mustard Oil", category: "Oils", quantity: 1, unit: "liter" },
      { name: "Turmeric Powder", category: "Spices", quantity: 100, unit: "grams" },
      { name: "Timmur", category: "Spices", quantity: 30, unit: "grams" },
      { name: "Cumin & Coriander Powder", category: "Spices", quantity: 200, unit: "grams" },
      { name: "Ginger & Garlic Paste", category: "Condiments", quantity: 250, unit: "grams" },
      { name: "Fenugreek Seeds (Methi)", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Whole Dry Chilies", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Iodized Salt", category: "Spices", quantity: 1, unit: "kg" }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    console.log("Purging old presets...");
    await PantryPreset.deleteMany({});

    console.log(`Injecting ${presets.length} Elite Kits...`);
    await PantryPreset.insertMany(presets);

    console.log("Seeding complete! 🥘✨");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
