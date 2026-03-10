const mongoose = require("mongoose");

const PresetItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "Other" },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "pcs" },
  },
  { _id: false }
);

const PantryPresetSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    items: { type: [PresetItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PantryPreset", PantryPresetSchema);
