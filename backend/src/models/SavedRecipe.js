const mongoose = require("mongoose");

const savedRecipeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true, index: true },
    savedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

savedRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.model("SavedRecipe", savedRecipeSchema);
