const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true, index: true },
    category: { type: String, required: true, index: true },
    defaultUnit: { type: String, default: "" },
    shelfLifeDays: { type: Number, default: 0, min: 0 },
    keywords: { type: [String], default: [] },
    isCustom: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true }
);

ingredientSchema.index({ name: 1, category: 1 }, { unique: true });
ingredientSchema.index({ name: "text", keywords: "text" });

module.exports = mongoose.model("Ingredient", ingredientSchema);
