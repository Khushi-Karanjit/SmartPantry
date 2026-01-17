const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");

const { getDashboardSummary } = require("../controllers/dashboard.controller");

router.get("/summary", requireAuth, getDashboardSummary);

module.exports = router;
