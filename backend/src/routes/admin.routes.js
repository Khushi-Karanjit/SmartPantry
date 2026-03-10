const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/stats", requireAuth, requireRole("admin"), adminController.getAdminStats);
router.get("/activities", requireAuth, requireRole("admin"), adminController.getAdminActivities);

module.exports = router;
