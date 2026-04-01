const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { requireAuth } = require("../middleware/auth");

// Protect all notification routes
router.use(requireAuth);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
