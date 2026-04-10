const PantryItem = require("../models/PantryItem");
const CookingLog = require("../models/CookingLog");

/**
 * Core logic for generating the Full Kitchen Report Data
 */
const getFullReportData = async (userId) => {
  // 1. Inventory Status
  const pantryItems = await PantryItem.find({ userId }).populate("categoryId");
  const lowStock = pantryItems.filter(item => item.quantity <= 2);
  
  // Mock expiry logic: Items added > 2 weeks ago are "Expiring Soon"
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 14);
  const expiringSoon = pantryItems.filter(item => new Date(item.addedAt) <= thresholdDate);

  // 2. Nutrition Summary (Last 7 Days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const logs = await CookingLog.find({ userId, performedAt: { $gte: sevenDaysAgo } }).populate("recipeId");

  let totalCalories = 0;
  let totalProtein = 0;
  logs.forEach(l => {
    if (l.recipeId) {
      totalCalories += l.recipeId.calories || 0;
      totalProtein += l.recipeId.protein || 0;
    }
  });

  // 3. Efficiency Score
  const efficiency = pantryItems.length > 0 
    ? Math.round(((pantryItems.length - expiringSoon.length) / pantryItems.length) * 100) 
    : 100;

  return {
    summary: {
      totalItems: pantryItems.length,
      lowStockCount: lowStock.length,
      expiryRiskCount: expiringSoon.length,
      efficiencyScore: efficiency
    },
    inventoryDetails: {
      lowStock: lowStock.map(i => ({ name: i.name, qty: i.quantity, unit: i.unit })),
      expiringSoon: expiringSoon.map(i => ({ name: i.name, added: i.addedAt }))
    },
    nutrition: {
      weeklyCalories: totalCalories,
      weeklyProtein: totalProtein,
      avgDailyCals: Math.round(totalCalories / 7)
    },
    generatedAt: new Date()
  };
};

module.exports = { getFullReportData };
