const mongoose = require("mongoose");

const cookingLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true, index: true },
    ingredientsUsed: [
      {
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient" },
        name: String,
        quantity: Number,
        unit: String
      }
    ],
    performedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CookingLog", cookingLogSchema);
