require("dotenv").config();
const { createApp } = require("./app");
const { connectDB } = require("./config/db");
const { initWorkers } = require("./services/worker.service");

async function start() {
  const app = createApp();
  
  // Connect to Database
  await connectDB(process.env.MONGO_URI);
  
  // Initialize Background Workers
  initWorkers();

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
