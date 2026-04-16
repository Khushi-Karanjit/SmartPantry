const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    diet: { type: String, default: "" },
    cuisines: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    excludeIngredients: { type: [String], default: [] },
    maxPrepMinutes: { type: Number, default: 0, min: 0 },
    mealsPerDay: { type: Number, default: 2, min: 1, max: 4 },
    repeatLimitWeekly: { type: Number, default: 2, min: 1, max: 7 },
    
    // Biometric Data for TDEE/BMR
    height: { type: Number, default: 0, min: 0 }, // in cm
    weight: { type: Number, default: 0, min: 0 }, // in kg
    age: { type: Number, default: 0, min: 0 },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    activityLevel: { 
      type: String, 
      enum: ["sedentary", "light", "moderate", "active", "very_active", ""], 
      default: "" 
    },

    // Daily Nutritional Targets
    caloriesTarget: { type: Number, default: 0, min: 0 },
    proteinTarget: { type: Number, default: 0, min: 0 },
    carbsTarget: { type: Number, default: 0, min: 0 },
    fatTarget: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserPreference", userPreferenceSchema);
