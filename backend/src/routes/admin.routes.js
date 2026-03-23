const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/stats", requireAuth, requireRole("admin"), adminController.getAdminStats);
router.get("/activities", requireAuth, requireRole("admin"), adminController.getAdminActivities);

router.get("/users", requireAuth, requireRole("admin"), adminController.getAdminUsers);
router.patch("/users/:id/status", requireAuth, requireRole("admin"), adminController.toggleUserStatus);
router.delete("/users/:id", requireAuth, requireRole("admin"), adminController.deleteUser);

router.get("/logs", requireAuth, requireRole("admin"), adminController.getAdminLogs);
router.get("/analytics", requireAuth, requireRole("admin"), adminController.getAdminAnalytics);

module.exports = router;
