require("dotenv").config();
const { createApp } = require("./app");
const { connectDB } = require("./config/db");
const { initWorkers } = require("./services/worker.service");
const { initScheduler } = require("./services/scheduler");
const { runSync } = require("./utils/autoSync");

async function start() {
  const app = createApp();
  
  // Connect to Database
  await connectDB(process.env.MONGO_URI);
  
  // Initialize Background Workers
  initWorkers();
  initScheduler();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    // Run Sync as a background task to avoid blocking startup
    runSync().catch(err => console.error("Auto-sync background error:", err));
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
