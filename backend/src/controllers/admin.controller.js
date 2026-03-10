const Recipe = require("../models/Recipe");
const User = require("../models/User");
const Category = require("../models/Category");

exports.getAdminStats = async (req, res) => {
  try {
    const totalRecipes = await Recipe.countDocuments();
    const publishedRecipes = await Recipe.countDocuments({ status: "published" });
    const draftRecipes = await Recipe.countDocuments({ status: "draft" });
    const archivedRecipes = await Recipe.countDocuments({ status: "archived" });
    
    const totalUsers = await User.countDocuments();
    const totalCategories = await Category.countDocuments();
    
    // For demo purposes, we'll assume some "pending" logic if needed, 
    // but for now let's just use the status.
    const reviewQueue = draftRecipes; 

    res.json({
      stats: {
        totalRecipes,
        publishedRecipes,
        draftRecipes,
        archivedRecipes,
        totalUsers,
        totalCategories,
        reviewQueue
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch admin stats" });
  }
};

exports.getAdminActivities = async (req, res) => {
  try {
    const recentRecipes = await Recipe.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name status updatedAt")
      .lean();

    const popularRecipes = await Recipe.find()
      .sort({ views: -1 })
      .limit(5)
      .select("name views status")
      .lean();
      
    res.json({ recentRecipes, popularRecipes });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch admin activities" });
  }
};
