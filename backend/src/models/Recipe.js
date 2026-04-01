const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "" },
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    cuisine: { type: String, default: "" },
    diet: { type: String, default: "" },
    tags: { type: [String], default: [] },
    prepMinutes: { type: Number, default: 0, min: 0 },
    calories: { type: Number, default: 0, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
    servings: { type: Number, default: 2, min: 1 },
    ingredients: { type: [ingredientSchema], default: [] },
    steps: { type: [String], default: [] },
    imageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
      index: true,
    },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

recipeSchema.index({ name: 1, cuisine: 1, diet: 1 });

module.exports = mongoose.model("Recipe", recipeSchema);
