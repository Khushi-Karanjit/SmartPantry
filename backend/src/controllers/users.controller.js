const User = require("../models/User");
const CookingLog = require("../models/CookingLog");
const PantryItem = require("../models/PantryItem");
const SavedRecipe = require("../models/SavedRecipe");
const bcrypt = require("bcryptjs");

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role || "user",
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const [user, pantryCount, recentLogs, savedRecipes] = await Promise.all([
      User.findById(req.userId).lean(),
      PantryItem.countDocuments({ userId: req.userId }),
      CookingLog.find({ userId: req.userId })
        .sort({ performedAt: -1 })
        .limit(5)
        .populate("recipeId", "name")
        .lean(),
      SavedRecipe.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("recipeId", "name cuisine prepMinutes calories")
        .lean()
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      profile: {
        ...user,
        id: user._id
      },
      stats: {
        totalPantryItems: pantryCount,
        totalCooked: await CookingLog.countDocuments({ userId: req.userId })
      },
      recentLogs,
      savedRecipes
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { username, email, avatarUrl } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (email) user.email = email.toLowerCase();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new passwords are required" });
    }

    const user = await User.findById(req.userId).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Incorrect current password" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { me, getProfile, updateProfile, changePassword };
