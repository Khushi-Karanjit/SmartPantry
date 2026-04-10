const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { createLog, getHistory } = require("../controllers/cookingLog.controller");

router.post("/", requireAuth, createLog);
router.get("/history", requireAuth, getHistory);

module.exports = router;
