const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { me, getProfile, updateProfile, changePassword } = require("../controllers/users.controller");

router.get("/me", requireAuth, me);
router.get("/profile", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);

module.exports = router;
