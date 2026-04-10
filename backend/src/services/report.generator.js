const CookingLog = require("../models/CookingLog");
const Recipe = require("../models/Recipe");

/**
 * Generates a weekly culinary summary report for a user
 */
const generateWeeklySummary = async (userId, username) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const logs = await CookingLog.find({
    userId,
    performedAt: { $gte: sevenDaysAgo }
  }).populate("recipeId");

  if (logs.length === 0) {
    return `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2>Hi ${username}! 🥘</h2>
        <p>It looks like you didn't log any meals this week. Let's get cooking next week!</p>
        <p style="color: #666;">- SmartPantry Team</p>
      </div>
    `;
  }

  // Aggregate stats
  let totalCalories = 0;
  let totalProtein = 0;
  const recipeCounts = {};
  const cuisines = new Set();

  logs.forEach(log => {
    if (log.recipeId) {
      totalCalories += log.recipeId.calories || 0;
      totalProtein += log.recipeId.protein || 0;
      cuisines.add(log.recipeId.cuisine || "Other");

      const name = log.recipeId.name;
      recipeCounts[name] = (recipeCounts[name] || 0) + 1;
    }
  });

  const topRecipe = Object.entries(recipeCounts).sort((a, b) => b[1] - a[1])[0][0];

  return `
    <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; background: #f8fafc;">
      <h1 style="color: #0f172a; margin-bottom: 24px; text-align: center;">Weekly Culinary Recap 🍱</h1>
      <p style="font-size: 18px; margin-bottom: 32px;">Hi <strong>${username}</strong>, here's what you achieved in the kitchen this week!</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;">
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Total Meals</p>
          <p style="font-size: 24px; font-weight: 800; color: #6366f1;">${logs.length}</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Weekly Calories</p>
          <p style="font-size: 24px; font-weight: 800; color: #8b5cf6;">${totalCalories.toLocaleString()}</p>
        </div>
      </div>

      <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
        <h3 style="margin-top: 0; color: #6366f1;">🏆 Top Recipe of the Week</h3>
        <p style="font-size: 20px; font-weight: 700; color: #0f172a;">${topRecipe}</p>
        <p style="color: #64748b;">You've mastered this one!</p>
      </div>

      <div style="margin-bottom: 32px;">
        <h4 style="color: #64748b; margin-bottom: 12px;">Culinary Diversity</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${Array.from(cuisines).map(c => `<span style="background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; margin-right: 8px;">${c}</span>`).join('')}
        </div>
      </div>

      <p style="font-size: 14px; text-align: center; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
        Stay motivated and keep cooking with SmartPantry! 🥂
      </p>
    </div>
  `;
};

module.exports = { generateWeeklySummary };
