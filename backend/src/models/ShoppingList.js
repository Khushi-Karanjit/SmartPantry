const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "" },
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", default: null },
    source: { type: String, enum: ["manual", "meal-plan"], default: "meal-plan" },
    checked: { type: Boolean, default: false }
  },
  { _id: false }
);

const shoppingListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart: { type: Date, required: true, index: true },
    items: { type: [itemSchema], default: [] },
    source: { type: String, default: "meal-plan" },
  },
  { timestamps: true }
);

shoppingListSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model("ShoppingList", shoppingListSchema);
