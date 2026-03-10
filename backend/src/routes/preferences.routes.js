const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { getPreferences, upsertPreferences } = require("../controllers/preferences.controller");

router.get("/me", requireAuth, getPreferences);
router.put("/me", requireAuth, upsertPreferences);

module.exports = router;
