const mongoose = require("mongoose");

const PantryItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    name: { type: String, required: true, trim: true },
    category: { type: String, default: "Other" },

    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "pcs" },

    expiryDate: { type: Date, default: null, index: true },

    source: { type: String, enum: ["manual", "preset"], default: "manual" },
    presetKey: { type: String, default: null },
  },
  { timestamps: true }
);

PantryItemSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model("PantryItem", PantryItemSchema);
