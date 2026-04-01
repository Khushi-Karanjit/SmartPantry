const PantryItem = require("../models/PantryItem");
const Recipe = require("../models/Recipe");
const CookingLog = require("../models/CookingLog");
const UserPreference = require("../models/UserPreference");

/**
 * Get user-specific nutritional and pantry analytics
 */
exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Pantry Composition (by Category)
    const pantryItems = await PantryItem.find({ userId }).populate("categoryId");
    const categoryCounts = {};
    pantryItems.forEach(item => {
      const catName = item.categoryId?.name || "Uncategorized";
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });

    const pantryComposition = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value
    }));

    // 2. Cooking / Nutritional History (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await CookingLog.find({
      userId,
      performedAt: { $gte: sevenDaysAgo }
    }).populate("recipeId");

    const dailyNutrition = {};
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        dailyNutrition[dateStr] = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
    }

    logs.forEach(log => {
      const dateStr = new Date(log.performedAt).toISOString().split("T")[0];
      if (dailyNutrition[dateStr] && log.recipeId) {
        dailyNutrition[dateStr].calories += log.recipeId.calories || 0;
        dailyNutrition[dateStr].protein += log.recipeId.protein || 0;
        dailyNutrition[dateStr].carbs += log.recipeId.carbs || 0;
        dailyNutrition[dateStr].fat += log.recipeId.fat || 0;
        dailyNutrition[dateStr].count += 1;
      }
    });

    const nutritionHistory = Object.entries(dailyNutrition)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3. User Targets
    const prefs = await UserPreference.findOne({ userId });
    const targets = {
      calories: prefs?.caloriesTarget || 2000,
      protein: prefs?.proteinTarget || 50,
      carbs: prefs?.carbsTarget || 250,
      fat: prefs?.fatTarget || 70
    };

    res.json({
        pantryComposition,
        nutritionHistory,
        targets
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};
