const cron = require("node-cron");
const PantryItem = require("../models/PantryItem");
const Ingredient = require("../models/Ingredient");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendAlertEmail } = require("./mail.service");

/**
 * Check for expiring items and low stock across all users
 */
async function checkPantryExpirations() {
  console.log("Running Daily Pantry Expiration Check...");
  
  try {
    const users = await User.find({ isActive: true });
    
    for (const user of users) {
      const items = await PantryItem.find({ userId: user._id }).populate("ingredientId");
      const alerts = [];
      const now = new Date();

      for (const item of items) {
        if (!item.ingredientId) continue;
        
        const shelfLife = item.ingredientId.shelfLifeDays || 0;
        if (shelfLife === 0) continue;

        const addedAt = new Date(item.addedAt);
        const expiryDate = new Date(addedAt.getTime() + shelfLife * 24 * 60 * 60 * 1000);
        const daysToExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        let priority = "low";
        let title = "";
        let message = "";

        if (daysToExpiry <= 1 && daysToExpiry >= 0) {
          priority = "high";
          title = "Item Expiring Tomorrow!";
          message = `Your ${item.name} is expiring within 24 hours. Use it soon!`;
        } else if (daysToExpiry <= 3 && daysToExpiry > 1) {
          priority = "medium";
          title = "Item Expiring Soon";
          message = `Your ${item.name} will expire in ${daysToExpiry} days.`;
        }

        if (title) {
          // Check if we already sent this specific notification today to avoid spam
          const existing = await Notification.findOne({
            userId: user._id,
            title,
            "metadata.itemId": item._id,
            createdAt: { $gte: new Date(now.setHours(0,0,0,0)) }
          });

          if (!existing) {
            const notif = await Notification.create({
              userId: user._id,
              title,
              message,
              priority,
              type: "expiry",
              metadata: { itemId: item._id }
            });
            alerts.push(notif);
          }
        }
      }

      // If we have high priority alerts, send an email
      if (alerts.some(a => a.priority === "high")) {
        try {
          await sendAlertEmail(user, alerts);
        } catch (mailError) {
          console.error(`Failed to send alert email to ${user.email}:`, mailError.message);
        }
      }
    }
  } catch (error) {
    console.error("Error in checkPantryExpirations:", error);
  }
}

/**
 * Initialize all cron jobs
 */
function initWorkers() {
  // Run every day at midnight (00:00)
  cron.schedule("0 0 * * *", () => {
    checkPantryExpirations();
  });

  // For testing purposes, you can uncomment this to run every minute
  // cron.schedule("* * * * *", () => {
  //   checkPantryExpirations();
  // });

  console.log("Global Pantry Workers Initialized (Daily at 00:00)");
}

module.exports = {
  initWorkers,
  checkPantryExpirations // Export for manual trigger if needed
};
