require("dotenv").config();
const mongoose = require("mongoose");
// Pre-register models to avoid MissingSchemaError during populate
require("../src/models/Category");
require("../src/models/Ingredient");
require("../src/models/PantryItem");
require("../src/models/CookingLog");
require("../src/models/Recipe");
const User = require("../src/models/User");

const { getFullReportData } = require("../src/services/report.service");
const { generateFullReportEmail } = require("../src/services/report.email.template");
const { sendEmail } = require("../src/services/email.service");

async function manualTrigger() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Broadcasting manual update...");
    
    const users = await User.find({ isActive: true });
    for (const user of users) {
      console.log(`Generating report for ${user.email}...`);
      const reportData = await getFullReportData(user._id);
      const htmlReport = generateFullReportEmail(reportData, user.username);
      console.log(`Sending email...`);
      await sendEmail(user.email, "Smart Pantry Status (Manual Test)", htmlReport);
    }
    
    console.log("Broadcast complete. Check your inbox!");
    process.exit(0);
  } catch (err) {
    console.error("Trigger failed:", err);
    process.exit(1);
  }
}

manualTrigger();
