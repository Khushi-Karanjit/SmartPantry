const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

router.get("/me", analyticsController.getUserAnalytics);
router.get("/report", analyticsController.getFullReport);
router.post("/report/test-email", analyticsController.testReportEmail);

module.exports = router;
