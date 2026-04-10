require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const Recipe = require("./src/models/Recipe");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const names = ["Golden Garlic Butter Chicken", "One-Pot Tomato Pasta", "Tasty Club Sandwich"];
    const res = await Recipe.deleteMany({ name: { $in: names } });
    console.log("Deleted", res.deletedCount, "old Tasty recipes");
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
