const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { listCategories, createCategory } = require("../controllers/category.controller");

router.get("/", requireAuth, listCategories);

// Optional: keep for seeding via Postman (you can remove later)
router.post("/", requireAuth, createCategory);

module.exports = router;
