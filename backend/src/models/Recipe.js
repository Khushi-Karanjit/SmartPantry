const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "g" },
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
    servings: { type: Number, default: 1, min: 1 },
    ingredients: { type: [ingredientSchema], default: [] },
    steps: {
      type: [{
        text: { type: String, required: true },
        startTime: { type: Number, default: 0 } // In seconds
      }],
      default: []
    },
    imageUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      default: "lunch",
      index: true,
    },
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

recipeSchema.index({ name: 1, cuisine: 1, diet: 1, mealType: 1 });

// Dynamic Macro Sync Hook
recipeSchema.pre("save", async function () {
  if (this.isModified("ingredients")) {
    try {
      // Lazy load to avoid circular dependency
      const { calculateRecipeMacros } = require("../services/nutrition.service");
      const macros = await calculateRecipeMacros(this.ingredients);
      
      this.calories = macros.calories;
      this.protein = macros.protein;
      this.carbs = macros.carbs;
      this.fat = macros.fat;
    } catch (err) {
      console.error("Macro calculation hook failed:", err);
    }
  }
});

module.exports = mongoose.model("Recipe", recipeSchema);
