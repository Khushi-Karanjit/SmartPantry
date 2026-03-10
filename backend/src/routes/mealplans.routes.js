const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { getCurrentPlan, generatePlan } = require("../controllers/mealplans.controller");

router.get("/current", requireAuth, getCurrentPlan);
router.post("/generate", requireAuth, generatePlan);

module.exports = router;
