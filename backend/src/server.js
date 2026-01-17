require("dotenv").config();
const { createApp } = require("./app");
const { connectDB } = require("./config/db");

async function start() {
  const app = createApp();
  await connectDB(process.env.MONGO_URI);

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
//   const dashboardRoutes = require("./routes/dashboardRoutes");
// app.use("/api/dashboard", dashboardRoutes);

}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
