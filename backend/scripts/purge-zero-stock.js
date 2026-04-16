const mongoose = require("mongoose");
require("dotenv").config();
const PantryItem = require("../src/models/PantryItem");

async function purgeZeroStock() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    console.log("Scanning for items with quantity <= 0...");
    const zeroStockItems = await PantryItem.find({ quantity: { $lte: 0 } });
    console.log(`Found ${zeroStockItems.length} items to purge.`);

    if (zeroStockItems.length > 0) {
      const result = await PantryItem.deleteMany({ quantity: { $lte: 0 } });
      console.log(`Successfully purged ${result.deletedCount} items from the database! 🗑️🧹`);
    } else {
      console.log("No zero-stock items found.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Purge failed:", err);
    process.exit(1);
  }
}

purgeZeroStock();
