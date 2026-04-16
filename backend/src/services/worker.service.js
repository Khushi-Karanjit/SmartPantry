const cron = require("node-cron");
const PantryItem = require("../models/PantryItem");
const Ingredient = require("../models/Ingredient");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendAlertEmail } = require("./mail.service");

/**
 * Check for expiring items and low stock across all users
 * Runs frequently to ensure "the moment" notifications are sent.
 */
async function checkPantryExpirations() {
  console.log("Running Real-Time Pantry Expiration Watcher...");
  
  try {
    const users = await User.find({ isActive: true });
    const now = new Date();

    for (const user of users) {
      // Find items and populate ingredient for shelfLife
      const items = await PantryItem.find({ userId: user._id }).populate("ingredientId");
      const alerts = [];

      for (const item of items) {
        if (!item.ingredientId) continue;
        
        const shelfLife = item.ingredientId.shelfLifeDays || 0;
        if (shelfLife === 0) continue;

        const addedAt = new Date(item.addedAt);
        const expiryDate = new Date(addedAt.getTime() + shelfLife * 24 * 60 * 60 * 1000);
        
        // Check if item JUST expired (or is already expired)
        if (expiryDate <= now) {
          // Check if we've already sent a "JUST EXPIRED" notification for this item
          const existingExpired = await Notification.findOne({
            userId: user._id,
            type: "expiry",
            "metadata.itemId": item._id,
            title: { $regex: /EXPIRED/i }
          });

          if (!existingExpired) {
            const notif = await Notification.create({
              userId: user._id,
              title: `${item.name.toUpperCase()} EXPIRED`,
              message: `This item has reached its shelf life as of ${expiryDate.toLocaleString()}. Please check it before use.`,
              priority: "high",
              type: "expiry",
              metadata: { itemId: item._id, event: "expired" }
            });
            alerts.push(notif);
            console.log(`[PROACTIVE ALERT] Sent expiry notice for ${item.name} to user ${user.username}`);
          }
          continue; // No need to check "expiring tomorrow" if it's already expired
        }

        // Secondary check: Expiring tomorrow (24h warning)
        const diffMs = expiryDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours <= 24 && diffHours > 0) {
          const existingWarning = await Notification.findOne({
            userId: user._id,
            type: "expiry",
            "metadata.itemId": item._id,
            title: { $regex: /TOMORROW/i },
            createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
          });

          if (!existingWarning) {
            const notif = await Notification.create({
              userId: user._id,
              title: `${item.name.toUpperCase()} EXPIRING TOMORROW`,
              message: `Your ${item.name} will reach its shelf life in less than 24 hours.`,
              priority: "high",
              type: "expiry",
              metadata: { itemId: item._id, event: "warning_24h" }
            });
            alerts.push(notif);
          }
        }
      }

      // Proactive Email for High Priority High Alert
      if (alerts.some(a => a.priority === "high")) {
        try {
          await sendAlertEmail(user, alerts);
        } catch (mailError) {
          console.error(`Failed to send alert email to ${user.email}:`, mailError.message);
        }
      }
    }
  } catch (error) {
    console.error("Error in checkPantryExpirations monitor:", error);
  }
}

/**
 * Initialize all cron jobs
 * Updated to high-frequency (every minute) for "the moment" accuracy.
 */
function initWorkers() {
  // Run every minute
  cron.schedule("* * * * *", () => {
    checkPantryExpirations();
  });

  console.log("Real-Time Pantry Watcher Initialized (Frequency: 1m)");
}

module.exports = {
  initWorkers,
  checkPantryExpirations // Export for manual trigger if needed
};
