const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
