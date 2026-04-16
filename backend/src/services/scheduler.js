const cron = require("node-cron");
const User = require("../models/User");
const { generateWeeklySummary } = require("./report.generator");
const { getFullReportData } = require("./report.service");
const { generateFullReportEmail } = require("./report.email.template");
const { sendEmail } = require("./email.service");

/**
 * Initializes the automated email scheduler
 */
const initScheduler = () => {
  // 1. Weekly Recap: Every Sunday at 08:00 AM
  cron.schedule("0 8 * * 0", async () => {
    console.log("[Scheduler] Starting Weekly Smart Pantry Status Broadcast...");
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        try {
          const htmlReport = await generateWeeklySummary(user._id, user.username);
          await sendEmail(user.email, "Smart Pantry Status: Weekly Recap", htmlReport);
        } catch (err) {
          console.error(`[Scheduler] Failed to send weekly report to ${user.email}:`, err);
        }
      }
      console.log("[Scheduler] Weekly Broadcast Complete.");
    } catch (error) {
      console.error("[Scheduler] Critical Error in Weekly Broadcast:", error);
    }
  });

  // 2. Daily Status Briefing: Every day at 08:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[Scheduler] Starting Daily Smart Pantry Status Broadcast...");
    try {
      const users = await User.find({ isActive: true });
      for (const user of users) {
        try {
          const reportData = await getFullReportData(user._id);
          const htmlReport = generateFullReportEmail(reportData, user.username);
          await sendEmail(user.email, "Smart Pantry Status", htmlReport);
        } catch (err) {
          console.error(`[Scheduler] Failed to send daily report to ${user.email}:`, err);
        }
      }
      console.log("[Scheduler] Daily Broadcast Complete.");
    } catch (error) {
      console.error("[Scheduler] Critical Error in Daily Broadcast:", error);
    }
  });

  // High-frequency (30m) audit removed as per professional tone refinement.

  console.log("[Scheduler] All Professional Email Jobs Initialized (8 AM Daily/Weekly).");
};

module.exports = { initScheduler };
