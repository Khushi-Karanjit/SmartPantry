const mongoose = require("mongoose");
const PantryItem = require("../models/PantryItem");

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
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Total items (mongoose can accept ObjectId)
    const totalItemsPromise = PantryItem.countDocuments({ userId: userObjectId });

    // Low stock
    const lowStockPromise = PantryItem.find({ userId: userObjectId, quantity: { $lte: 1 } })
      .select("name quantity unit")
      .sort({ quantity: 1 })
      .limit(3)
      .lean();

    // Expiry computation using addedAt + category.shelfLifeDays
    const expiryAgg = await PantryItem.aggregate([
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
        $addFields: {
          shelfLifeDays: { $ifNull: ["$category.shelfLifeDays", 0] },
        },
      },
      {
        $addFields: {
          expiryAt: {
            $dateAdd: {
              startDate: "$addedAt",
              unit: "day",
              amount: "$shelfLifeDays",
            },
          },
        },
      },
      {
        $addFields: {
          isExpired: { $lt: ["$expiryAt", now] },
          isExpiringSoon: {
            $and: [{ $gte: ["$expiryAt", now] }, { $lte: ["$expiryAt", in48h] }],
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

    const reminders = [
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
    ].slice(0, 6);

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

    const capacityMax = 50;
    const capacityUsedPercent = Math.min(100, Math.round((totalItems / capacityMax) * 100));

    return res.json({
      stats: {
        totalItems,
        expiringSoonCount,
        capacityUsedPercent,
        mealsPlannedToday: 0,
      },
      reminders,
      composition,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load dashboard summary" });
  }
};
