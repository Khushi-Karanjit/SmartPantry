const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true, index: true },
    category: { type: String, required: true, index: true },
    defaultUnit: { type: String, default: 'g' },
    shelfLifeDays: { type: Number, default: 0, min: 0 },
    
    // Nutritional density: Density values per 1g (mass/volume) OR per 1 unit (discrete)
    // Calories are dynamically derived via the 4-4-9 Rule: (P*4 + C*4 + F*9)
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    // Weight in grams for a single "piece" or "pcs" (optional, for discrete items)
    gramsPerUnit: { type: Number, default: 0 },

    keywords: { type: [String], default: [] },
    isCustom: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true }
);

ingredientSchema.index({ name: 1, category: 1 }, { unique: true });
ingredientSchema.index({ name: "text", keywords: "text" });

module.exports = mongoose.model("Ingredient", ingredientSchema);
