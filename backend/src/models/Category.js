const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    shelfLifeDays: { type: Number, required: true, min: 1 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Category", CategorySchema);
