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
    const days = parseInt(req.query.days) || 30;
    const cuisineFilter = req.query.cuisine;

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

    // 2. Cooking / Nutritional History
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logsRaw = await CookingLog.find({
      userId,
      performedAt: { $gte: startDate }
    }).populate("recipeId");

    // Filter by cuisine if requested
    const logs = cuisineFilter && cuisineFilter !== "Global" 
      ? logsRaw.filter(l => l.recipeId?.cuisine === cuisineFilter)
      : logsRaw;

    const dailyNutrition = {};
    // Initialize the window based on requested days
    for (let i = 0; i < days; i++) {
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

    // 4. Advanced Recipe Usage Analysis
    const allLogsRaw = await CookingLog.find({ userId }).populate("recipeId");
    const allLogs = cuisineFilter && cuisineFilter !== "Global"
      ? allLogsRaw.filter(l => l.recipeId?.cuisine === cuisineFilter)
      : allLogsRaw;
    
    // Cuisine Mastery & Stats
    const cuisines = {};
    const mealTypes = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    const recipeCounts = {};

    allLogs.forEach(log => {
      if (log.recipeId) {
        const c = log.recipeId.cuisine || "Other";
        cuisines[c] = (cuisines[c] || 0) + 1;
        
        const m = log.recipeId.mealType || "snack";
        mealTypes[m] = (mealTypes[m] || 0) + 1;

        const rid = log.recipeId._id.toString();
        if (!recipeCounts[rid]) {
          recipeCounts[rid] = { count: 0, name: log.recipeId.name, image: log.recipeId.imageUrl };
        }
        recipeCounts[rid].count++;
      }
    });

    const cuisineMastery = Object.entries(cuisines).map(([name, value]) => ({ name, value }));
    const mealTypeStats = Object.entries(mealTypes).map(([name, value]) => ({ name, value }));
    const topRecipes = Object.values(recipeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Cooking Streak Calculation (Only if global or if current logs match)
    let streak = 0;
    const logDates = new Set(allLogs.map(l => new Date(l.performedAt).toISOString().split("T")[0]));
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (logDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streak === 0 && dateStr === new Date().toISOString().split("T")[0]) {
           checkDate.setDate(checkDate.getDate() - 1);
           continue;
        }
        break;
      }
    }

    res.json({
        pantryComposition,
        nutritionHistory,
        targets,
        cuisineMastery,
        topRecipes,
        mealTypeStats,
        streak
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};

const Notification = require("../models/Notification");
const User = require("../models/User");
const { getFullReportData } = require("../services/report.service");
const { generateFullReportEmail } = require("../services/report.email.template");
const { sendEmail } = require("../services/email.service");

/**
 * Generate a comprehensive status report
 */
exports.getFullReport = async (req, res) => {
  try {
    const userId = req.userId;
    const reportData = await getFullReportData(userId);
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: "Error generating full report", error: error.message });
  }
};

/**
 * Send a test report email to the logged in user
 */
exports.testReportEmail = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const reportData = await getFullReportData(userId);
    const html = generateFullReportEmail(reportData, user.username);
    
    await sendEmail(user.email, "Manual Test: Kitchen Status Audit 🏛️", html);

    res.json({ message: "Test report email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending test email", error: error.message });
  }
};
