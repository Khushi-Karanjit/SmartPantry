const express = require("express");
const cors = require("cors");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );

  app.use(express.json());

  // Debug: show requests (helps during dev)
  app.use((req, res, next) => {
    console.log("INCOMING:", req.method, req.originalUrl);
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, message: "SmartPantry API running" });
  });

  app.use("/api/auth", require("./routes/auth.routes"));
  app.use("/api/users", require("./routes/users.routes"));
  app.use("/api/pantry", require("./routes/pantry.routes"));
  app.use("/api/categories", require("./routes/categories.routes"));
  app.use("/api/dashboard", require("./routes/dashboard.routes"));
  app.use("/api/recipes", require("./routes/recipes.routes"));
  app.use("/api/preferences", require("./routes/preferences.routes"));
  app.use("/api/analytics", require("./routes/analytics.routes"));
  app.use("/api/meal-plans", require("./routes/mealplans.routes"));
  app.use("/api/shopping-lists", require("./routes/shoppinglists.routes"));
  app.use("/api/ingredients", require("./routes/ingredients.routes"));
  app.use("/api/notifications", require("./routes/notification.routes"));
  app.use("/api/admin", require("./routes/admin.routes"));


  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  });

  return app;
}

module.exports = { createApp };
