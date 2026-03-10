const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { getCurrentShoppingList } = require("../controllers/shoppinglists.controller");

router.get("/current", requireAuth, getCurrentShoppingList);

module.exports = router;
