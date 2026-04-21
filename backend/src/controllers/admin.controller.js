const Recipe = require("../models/Recipe");
const User = require("../models/User");
const Category = require("../models/Category");
const PantryItem = require("../models/PantryItem");
const CookingLog = require("../models/CookingLog");
const Ingredient = require("../models/Ingredient");

exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalRecipes,
      publishedRecipes,
      draftRecipes,
      archivedRecipes,
      totalUsers,
      totalCategories,
      totalPantryItems,
      totalCookingActivities
    ] = await Promise.all([
      Recipe.countDocuments(),
      Recipe.countDocuments({ status: "published" }),
      Recipe.countDocuments({ status: "draft" }),
      Recipe.countDocuments({ status: "archived" }),
      User.countDocuments(),
      Category.countDocuments(),
      PantryItem.countDocuments(),
      CookingLog.countDocuments()
    ]);

    // Most cooked recipe (top by CookingLog frequency)
    const mostCookedAgg = await CookingLog.aggregate([
      { $group: { _id: "$recipeId", count: { $sum: 1 } } },
      { $lookup: { from: "recipes", localField: "_id", foreignField: "_id", as: "recipe" } },
      { $match: { "recipe.0": { $exists: true } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $unwind: "$recipe" }
    ]);
    const mostCookedRecipe = mostCookedAgg[0]?.recipe?.name || "N/A";

    // User Growth (New in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersCount = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      stats: {
        totalRecipes,
        publishedRecipes,
        draftRecipes,
        archivedRecipes,
        totalUsers,
        totalCategories,
        totalPantryItems,
        totalCookingActivities,
        reviewQueue: draftRecipes,
        mostCookedRecipe,
        newUsersCount
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

exports.getAdminUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const query = {};
    if (q) {
      query.$or = [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ];
    }
    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch users" });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to toggle user status" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete user" });
  }
};

exports.getAdminLogs = async (req, res) => {
  try {
    const { userId, recipeId, days } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (recipeId) query.recipeId = recipeId;
    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      query.performedAt = { $gte: date };
    }

    const logs = await CookingLog.find(query)
      .sort({ performedAt: -1 })
      .limit(100)
      .populate("userId", "username email")
      .populate("recipeId", "name")
      .lean();

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch logs" });
  }
};

exports.getAdminAnalytics = async (req, res) => {
  try {
    // Most cooked recipes (top 10)
    const mostCooked = await CookingLog.aggregate([
      { $group: { _id: "$recipeId", count: { $sum: 1 } } },
      { $lookup: { from: "recipes", localField: "_id", foreignField: "_id", as: "recipe" } },
      { $match: { "recipe.0": { $exists: true } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $unwind: "$recipe" },
      { $project: { name: "$recipe.name", count: 1 } }
    ]);

    res.json({ mostCooked });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch analytics" });
  }
};

exports.getAdminRecipes = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", status = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    const [recipes, totalCount] = await Promise.all([
      Recipe.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Recipe.countDocuments(query)
    ]);

    res.json({
      recipes,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch admin recipes" });
  }
};
