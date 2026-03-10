const ShoppingList = require("../models/ShoppingList");

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getCurrentShoppingList(req, res, next) {
  try {
    const weekStart = startOfWeek(new Date());
    const list = await ShoppingList.findOne({ userId: req.userId, weekStart }).lean();
    res.json({ shoppingList: list || null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCurrentShoppingList };
