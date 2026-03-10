const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    mealType: { type: String, required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    meals: { type: [mealSchema], default: [] },
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStart: { type: Date, required: true, index: true },
    days: { type: [daySchema], default: [] },
    shoppingListId: { type: mongoose.Schema.Types.ObjectId, ref: "ShoppingList", default: null },
  },
  { timestamps: true }
);

mealPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model("MealPlan", mealPlanSchema);
