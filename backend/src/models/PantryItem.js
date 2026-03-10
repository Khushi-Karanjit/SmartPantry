const mongoose = require("mongoose");

const PantryItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    name: { type: String, required: true, trim: true },
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
      index: true,
    },

    // NEW: reference category (Option B)
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    // Keep these if you already have them
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "pcs" },

    // NEW: base date used for expiry calculation
    addedAt: { type: Date, default: Date.now, index: true },

    // Stop storing expiryDate as user-input.
    // If your old schema has expiryDate, you can keep it for now but ignore it.
    // expiryDate: { type: Date, default: null },

    source: { type: String, enum: ["manual", "preset"], default: "manual" },
    presetKey: { type: String, default: null },
  },
  { timestamps: true }
);

PantryItemSchema.index({ userId: 1, ingredientId: 1 });

module.exports = mongoose.model("PantryItem", PantryItemSchema);
