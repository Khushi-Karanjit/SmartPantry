const mongoose = require("mongoose");
const PantryItem = require("../models/PantryItem");
const Notification = require("../models/Notification");

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  return null;
}

exports.getDashboardSummary = async (req, res) => {
  try {
    const userIdRaw = req.userId; // from requireAuth -> payload.sub
    const userObjectId = toObjectId(userIdRaw);

    if (!userObjectId) {
      return res.status(401).json({ message: "Unauthorized (invalid user id in token)" });
    }

    const now = new Date();
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayUTC = new Date(todayStr + "T00:00:00Z");
    const tomorrowUTC = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000);
    const in72hUTC = new Date(todayUTC.getTime() + 72 * 60 * 60 * 1000);

    // Total items (mongoose can accept ObjectId)
    const totalItemsPromise = PantryItem.countDocuments({ userId: userObjectId });

    // Low stock
    const lowStockPromise = PantryItem.find({ userId: userObjectId, quantity: { $lte: 1 } })
      .select("name quantity unit")
      .sort({ quantity: 1 })
      .limit(3)
      .lean();

    // Expiry computation using ingredient.shelfLifeDays || category.shelfLifeDays || 30
    const expiryAgg = await PantryItem.aggregate([
      { $match: { userId: userObjectId } },
      {
        $lookup: {
          from: "ingredients",
          localField: "ingredientId",
          foreignField: "_id",
          as: "ingredient",
        },
      },
      { $unwind: { path: "$ingredient", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          shelfLifeDays: {
            $ifNull: [
              "$ingredient.shelfLifeDays",
              { $ifNull: ["$category.shelfLifeDays", 30] },
            ],
          },
        },
      },
      {
        $addFields: {
          expiryAt: {
            $dateAdd: {
              startDate: { $ifNull: ["$addedAt", "$createdAt"] },
              unit: "day",
              amount: "$shelfLifeDays",
            },
          },
        },
      },
      {
        $addFields: {
          isExpired: { $lt: ["$expiryAt", tomorrowUTC] }, 
          isExpiringSoon: {
            $and: [
              { $gte: ["$expiryAt", tomorrowUTC] }, 
              { $lte: ["$expiryAt", in72hUTC] }
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          expiryAt: 1,
          isExpired: 1,
          isExpiringSoon: 1,
        },
      },
    ]);

    const expiringSoonCount = expiryAgg.filter((x) => x.isExpiringSoon).length;

    const expiredItems = expiryAgg
      .filter((x) => x.isExpired)
      .sort((a, b) => new Date(b.expiryAt) - new Date(a.expiryAt))
      .slice(0, 3);

    const expiringItems = expiryAgg
      .filter((x) => x.isExpiringSoon)
      .sort((a, b) => new Date(a.expiryAt) - new Date(b.expiryAt))
      .slice(0, 3);

    const lowStockItems = await lowStockPromise;
    const persistentNotifications = await Notification.find({ userId: userObjectId, isRead: false })
      .sort({ createdAt: -1 })
      .limit(3);

    const reminders = [
      ...persistentNotifications.map((n) => ({
        type: n.type === "expiry" ? "expired" : "info",
        text: n.title,
        meta: n.createdAt.toISOString(),
        description: n.message,
      })),
      ...expiredItems.map((it) => ({
        type: "expired",
        text: `${it.name} expired`,
        meta: it.expiryAt ? new Date(it.expiryAt).toISOString() : null,
      })),
      ...expiringItems.map((it) => ({
        type: "expiring",
        text: `${it.name} expires soon`,
        meta: it.expiryAt ? new Date(it.expiryAt).toISOString() : null,
      })),
      ...lowStockItems.map((it) => ({
        type: "low",
        text: `${it.name} is running low (${it.quantity}${it.unit ? ` ${it.unit}` : ""})`,
        meta: null,
      })),
    ].slice(0, 10);

    // Composition by category name
    const compositionAgg = await PantryItem.aggregate([
      { $match: { userId: userObjectId } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$category.name", "Unknown"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalForComposition = compositionAgg.reduce((s, x) => s + x.count, 0) || 0;
    const composition = compositionAgg.map((x) => ({
      category: x._id,
      count: x.count,
      percent: totalForComposition ? Math.round((x.count / totalForComposition) * 100) : 0,
    }));

    const totalItems = await totalItemsPromise;

    const capacityMax = 100;
    const capacityUsedPercent = Math.min(100, Math.round((totalItems / capacityMax) * 100));

    const expiredCount = expiryAgg.filter(x => x.isExpired).length;

    return res.json({
      stats: {
        totalItems,
        expiringSoonCount,
        expiredCount,
        capacityUsedPercent,
      },
      reminders,
      composition,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load dashboard summary" });
  }
};
