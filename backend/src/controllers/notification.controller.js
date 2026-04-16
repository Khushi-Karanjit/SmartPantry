const Notification = require("../models/Notification");
const PantryItem = require("../models/PantryItem");

/**
 * Get all notifications for the current user, including synthesized pantry alerts
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 1. Fetch persistent notifications from DB
    const dbNotifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // 2. Synthesize dynamic alerts from Pantry
    // (Identifying expired and expiring items using shelf life logic)
    // Filter out items that already have a hard notification in dbNotifications to avoid duplicates
    const dbNotifItemIds = dbNotifications
      .filter(n => n.metadata && n.metadata.itemId)
      .map(n => n.metadata.itemId.toString());

    const pantryAlertsAgg = await PantryItem.aggregate([
      { $match: { 
          userId: require('mongoose').Types.ObjectId.createFromHexString(userId),
          _id: { $nin: dbNotifItemIds.map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) }
      } },
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
        $match: {
          $or: [
            { isExpired: true },
            { isExpiringSoon: true },
            { quantity: { $lte: 1 } }
          ]
        }
      },
      {
        $project: {
          name: 1,
          expiryAt: 1,
          isExpired: 1,
          isExpiringSoon: 1,
          quantity: 1,
          unit: 1
        }
      }
    ]);

    const synthesizedAlerts = pantryAlertsAgg.map(item => {
      let type = "info";
      let priority = "low";
      let title = "";
      let message = "";

      if (item.isExpired) {
        type = "expiry";
        priority = "high";
        title = `${item.name.toUpperCase()} EXPIRED`;
        message = `This item reached its shelf life on ${new Date(item.expiryAt).toLocaleDateString()}.`;
      } else if (item.isExpiringSoon) {
        type = "expiry";
        priority = "medium";
        title = `${item.name.toUpperCase()} EXPIRING`;
        message = `This item will expire soon (${new Date(item.expiryAt).toLocaleDateString()}).`;
      } else if (item.quantity <= 1) {
        type = "low_stock";
        priority = "medium";
        title = `${item.name.toUpperCase()} LOW STOCK`;
        message = `You only have ${item.quantity}${item.unit ? ` ${item.unit}` : ''} left.`;
      }

      return {
        _id: `temp-${item._id}`, // Marker for synthesized alerts
        userId,
        title,
        message,
        type,
        priority,
        isRead: false,
        createdAt: item.expiryAt || new Date(),
        isDynamic: true
      };
    });

    // Merge and sort by priority then date
    const allNotifications = [...synthesizedAlerts, ...dbNotifications].sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      if (priorityMap[b.priority] !== priorityMap[a.priority]) {
        return priorityMap[b.priority] - priorityMap[a.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ notifications: allNotifications });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification", error: error.message });
  }
};

/**
 * Mark all notifications as read for current user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications", error: error.message });
  }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const id = req.params.id;
    const notification = await Notification.findOneAndDelete({ _id: id, userId: req.userId });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification", error: error.message });
  }
};
