const cron = require("node-cron");
const User = require("../models/User");
const { generateWeeklySummary } = require("./report.generator");
const { getFullReportData } = require("./report.service");
const { generateFullReportEmail } = require("./report.email.template");
const { sendEmail } = require("./email.service");

/**
 * Initializes the weekly email scheduler
 */
const initScheduler = () => {
  // 1. Weekly Recap: Every Sunday at Midnight
  cron.schedule("0 0 * * 0", async () => {
    console.log("[Scheduler] Starting Weekly Email Broadcast...");
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        try {
          const htmlReport = await generateWeeklySummary(user._id, user.username);
          await sendEmail(user.email, "Your Weekly Culinary Recap 🥘", htmlReport);
        } catch (err) {
          console.error(`[Scheduler] Failed to send weekly report to ${user.email}:`, err);
        }
      }
      console.log("[Scheduler] Weekly Broadcast Complete.");
    } catch (error) {
      console.error("[Scheduler] Critical Error in Weekly Broadcast:", error);
    }
  });

  // 2. Daily Kitchen Pulse: Every day at Midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[Scheduler] Starting Daily Kitchen Pulse Broadcast...");
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        try {
          const reportData = await getFullReportData(user._id);
          const htmlReport = generateFullReportEmail(reportData, user.username);
          await sendEmail(user.email, "Daily Kitchen Status Audit 🏛️", htmlReport);
        } catch (err) {
          console.error(`[Scheduler] Failed to send daily report to ${user.email}:`, err);
        }
      }
      console.log("[Scheduler] Daily Broadcast Complete.");
    } catch (error) {
      console.error("[Scheduler] Critical Error in Daily Broadcast:", error);
    }
  });

  // 3. High-Frequency Audit: Every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("[Scheduler] Starting 30-Minute High-Frequency Audit...");
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        try {
          const reportData = await getFullReportData(user._id);
          const htmlReport = generateFullReportEmail(reportData, user.username);
          await sendEmail(user.email, "High-Frequency Kitchen Pulse Audit ⚡", htmlReport);
        } catch (err) {
          console.error(`[Scheduler] Failed to send 30-min audit to ${user.email}:`, err);
        }
      }
      console.log("[Scheduler] 30-Minute Audit Complete.");
    } catch (error) {
      console.error("[Scheduler] Critical Error in 30-Minute Audit:", error);
    }
  });

  console.log("[Scheduler] All Email Jobs Initialized.");
};

module.exports = { initScheduler };
