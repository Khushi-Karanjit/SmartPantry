/**
 * SmartPantry — Full Unit Test Suite
 * Run: npx jest --verbose
 * Evidence: Screenshot the terminal output showing PASS/FAIL per test
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { singularize } = require("./src/utils/singularize");

const JWT_SECRET = process.env.JWT_SECRET || "smartpantry-test-secret";

// ─── Auth helper functions (mirrors auth.controller.js logic) ─────────────────
async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ─── Pantry expiry helpers ─────────────────────────────────────────────────────
function daysUntil(addedAt, shelfLifeDays) {
  const expiry = new Date(addedAt);
  expiry.setDate(expiry.getDate() + shelfLifeDays);
  return Math.floor((expiry - new Date()) / (1000 * 60 * 60 * 24));
}
function statusOf(item) {
  const d = daysUntil(item.addedAt, item.shelfLifeDays);
  if (d < 0)  return { kind: "expired", label: "EXPIRED" };
  if (d <= 2) return { kind: "urgent",  label: "URGENT"  };
  return { kind: "fresh", label: "FRESH" };
}

// ─── Smart Restock op ─────────────────────────────────────────────────────────
function determineRestockOp(existingItem, newQty) {
  const d = daysUntil(existingItem.addedAt, existingItem.shelfLifeDays);
  if (d < 0)  return { op: "$set", quantity: newQty, restockStatus: "cleared" };
  if (d <= 2) return { op: "$inc", quantity: newQty, restockStatus: "urgent_merge" };
  return { op: "$inc", quantity: newQty, restockStatus: "standard" };
}

// ─── Calorie calculation ───────────────────────────────────────────────────────
function calculateCalories(protein, carbs, fat) {
  return (protein * 4) + (carbs * 4) + (fat * 9);
}

// ─── Recipe scoring ───────────────────────────────────────────────────────────
function scoreRecipe(requiredIds, availableIds) {
  if (!requiredIds.length) return 0;
  const matched = requiredIds.filter(id => availableIds.includes(id)).length;
  return matched / requiredIds.length;
}

// ─── Calorie tolerance ────────────────────────────────────────────────────────
function isWithinTolerance(actual, target, pct = 0.1) {
  return Math.abs(actual - target) <= target * pct;
}

// ─── Shopping list aggregation ────────────────────────────────────────────────
function aggregateShoppingList(meals) {
  const map = {};
  for (const meal of meals) {
    for (const ing of meal.ingredients || []) {
      if (map[ing.name]) map[ing.name].qty += ing.qty;
      else map[ing.name] = { name: ing.name, qty: ing.qty };
    }
  }
  return Object.values(map);
}

// ─── Waste score ──────────────────────────────────────────────────────────────
function calculateWasteScore(pantryItems) {
  if (!pantryItems.length) return 0;
  const expired = pantryItems.filter(i => statusOf(i).kind === "expired").length;
  return Math.round((expired / pantryItems.length) * 100);
}

// ─── Most cooked ──────────────────────────────────────────────────────────────
function getMostCooked(logs) {
  return logs.reduce((top, cur) => cur.count > top.count ? cur : top, logs[0])?.recipe;
}

// ─── Notification helper ──────────────────────────────────────────────────────
function shouldNotify(item, existingNotifications) {
  const d = daysUntil(item.addedAt, item.shelfLifeDays);
  const type = d < 0 ? "EXPIRED_ITEM" : d <= 2 ? "EXPIRY_WARNING" : null;
  if (!type) return { generate: false };
  const alreadyExists = existingNotifications.some(n => n.itemId === item._id && n.type === type);
  if (alreadyExists) return { generate: false };
  return { generate: true, type };
}

// ─── Admin check ─────────────────────────────────────────────────────────────
function isAdmin(user) {
  return user?.role === "admin";
}

// ─── Migration helpers ────────────────────────────────────────────────────────
function needsNormalization(name) {
  const singular = singularize(name.toLowerCase()).toUpperCase();
  return singular !== name ? { normalize: true, singularName: singular } : { normalize: false };
}
function decideMergeAction(original, singularized, existingInDB) {
  if (original === singularized) return { action: "skip" };
  return existingInDB ? { action: "merge" } : { action: "rename" };
}

// ══════════════════════════════════════════════════════════════════
//  TEST SUITES
// ══════════════════════════════════════════════════════════════════

// ── Feature 1: Authentication ─────────────────────────────────────
describe("Feature 1 — Authentication", () => {
  let storedHash;

  beforeAll(async () => {
    storedHash = await hashPassword("mypassword123");
  });

  test("TC-U-01: Password is hashed and not stored as plain text", async () => {
    expect(storedHash).not.toBe("mypassword123");
    expect(storedHash).toMatch(/^\$2b\$/);
  });

  test("TC-U-02: Correct password is accepted", async () => {
    const result = await comparePassword("mypassword123", storedHash);
    expect(result).toBe(true);
  });

  test("TC-U-03: Wrong password is rejected", async () => {
    const result = await comparePassword("wrongpassword", storedHash);
    expect(result).toBe(false);
  });

  test("TC-U-04: JWT token can be generated and verified", () => {
    const token = generateToken("user123");
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe("user123");
  });
});

// ── Feature 2: Pantry Expiry Status ───────────────────────────────
describe("Feature 2 — Pantry Expiry Status", () => {
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

  test("TC-U-05: Item added today with 7-day shelf life shows FRESH", () => {
    const item = { addedAt: daysAgo(0), shelfLifeDays: 7 };
    expect(statusOf(item).kind).toBe("fresh");
  });

  test("TC-U-06: Item with 1 day left shows URGENT", () => {
    const item = { addedAt: daysAgo(6), shelfLifeDays: 7 };
    expect(statusOf(item).kind).toBe("urgent");
  });

  test("TC-U-07: Item 30 days old with 7-day shelf life shows EXPIRED", () => {
    const item = { addedAt: daysAgo(30), shelfLifeDays: 7 };
    expect(statusOf(item).kind).toBe("expired");
  });
});

// ── Feature 2b: Smart Restock ─────────────────────────────────────
describe("Feature 2 — Smart Restock Policy", () => {
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

  test("TC-U-08: Restocking EXPIRED item discards old quantity ($set)", () => {
    const item = { addedAt: daysAgo(30), shelfLifeDays: 7, quantity: 10 };
    const result = determineRestockOp(item, 3);
    expect(result.op).toBe("$set");
    expect(result.restockStatus).toBe("cleared");
    expect(result.quantity).toBe(3);
  });

  test("TC-U-09: Restocking URGENT item merges with warning", () => {
    const item = { addedAt: daysAgo(6), shelfLifeDays: 7, quantity: 2 };
    const result = determineRestockOp(item, 5);
    expect(result.op).toBe("$inc");
    expect(result.restockStatus).toBe("urgent_merge");
  });

  test("TC-U-10: Restocking FRESH item does standard increment", () => {
    const item = { addedAt: daysAgo(0), shelfLifeDays: 7, quantity: 5 };
    const result = determineRestockOp(item, 2);
    expect(result.op).toBe("$inc");
    expect(result.restockStatus).toBe("standard");
  });
});

// ── Feature 3: Ingredient Normalization ──────────────────────────
describe("Feature 3 — Ingredient Normalization (singularize)", () => {
  test("TC-U-11: Plural word 'apples' returns 'apple'", () => {
    expect(singularize("apples")).toBe("apple");
  });

  test("TC-U-12: '-ies' ending 'berries' returns 'berry'", () => {
    expect(singularize("berries")).toBe("berry");
  });

  test("TC-U-13: Irregular 'tomatoes' returns 'tomato', 'chilies' returns 'chili'", () => {
    expect(singularize("tomatoes")).toBe("tomato");
    expect(singularize("chilies")).toBe("chili");
  });

  test("TC-U-14: Invariant word 'rice' and 'flour' are unchanged", () => {
    expect(singularize("rice")).toBe("rice");
    expect(singularize("flour")).toBe("flour");
  });
});

// ── Feature 4: Recipe Nutritional Calculation ─────────────────────
describe("Feature 4 — Recipe Macros (4-4-9 Rule)", () => {
  test("TC-U-15: Calories = protein×4 + carbs×4 + fat×9", () => {
    expect(calculateCalories(20, 30, 10)).toBe(290);
  });

  test("TC-U-16: Zero macros returns zero calories", () => {
    expect(calculateCalories(0, 0, 0)).toBe(0);
  });

  test("TC-U-16b: Fat-only ingredient calculates correctly", () => {
    expect(calculateCalories(0, 0, 10)).toBe(90);
  });
});

// ── Feature 5: Recipe Suggester ───────────────────────────────────
describe("Feature 5 — Recipe Suggester Scoring", () => {
  test("TC-U-17: All ingredients available returns score 1.0", () => {
    expect(scoreRecipe(["A","B","C"], ["A","B","C"])).toBe(1.0);
  });

  test("TC-U-18: Partial match 2/3 returns ~0.67", () => {
    expect(scoreRecipe(["A","B","C"], ["A","B"])).toBeCloseTo(0.67, 2);
  });

  test("TC-U-18b: No ingredients match returns 0", () => {
    expect(scoreRecipe(["X","Y"], ["A","B"])).toBe(0);
  });
});

// ── Feature 6: Meal Planner ───────────────────────────────────────
describe("Feature 6 — Meal Planner", () => {
  test("TC-U-19: 1950 kcal is within ±10% of 2000 kcal target", () => {
    expect(isWithinTolerance(1950, 2000)).toBe(true);
  });

  test("TC-U-19b: 2300 kcal exceeds ±10% of 2000 kcal target", () => {
    expect(isWithinTolerance(2300, 2000)).toBe(false);
  });

  test("TC-U-20: Shopping list merges duplicate onion entries", () => {
    const meals = [
      { ingredients: [{ name: "onion", qty: 2 }] },
      { ingredients: [{ name: "onion", qty: 1 }] },
    ];
    const list = aggregateShoppingList(meals);
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({ name: "onion", qty: 3 });
  });

  test("TC-U-20b: Shopping list keeps different ingredients separate", () => {
    const meals = [
      { ingredients: [{ name: "garlic", qty: 3 }] },
      { ingredients: [{ name: "ginger", qty: 2 }] },
    ];
    const list = aggregateShoppingList(meals);
    expect(list).toHaveLength(2);
  });

  test("TC-U-20c: Empty meal plan returns empty shopping list", () => {
    expect(aggregateShoppingList([])).toEqual([]);
  });
});

// ── Feature 7: Analytics ──────────────────────────────────────────
describe("Feature 7 — Analytics", () => {
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

  test("TC-U-21: Waste score > 0 when expired items exist", () => {
    const items = [
      { addedAt: daysAgo(0), shelfLifeDays: 7 },
      { addedAt: daysAgo(0), shelfLifeDays: 7 },
      { addedAt: daysAgo(30), shelfLifeDays: 7 },
    ];
    expect(calculateWasteScore(items)).toBeGreaterThan(0);
  });

  test("TC-U-21b: Waste score is 0 when no expired items", () => {
    const items = [
      { addedAt: daysAgo(0), shelfLifeDays: 7 },
      { addedAt: daysAgo(1), shelfLifeDays: 7 },
    ];
    expect(calculateWasteScore(items)).toBe(0);
  });

  test("TC-U-22: Most cooked recipe correctly identified", () => {
    const logs = [{ recipe: "Pasta", count: 5 }, { recipe: "Salad", count: 2 }];
    expect(getMostCooked(logs)).toBe("Pasta");
  });
});

// ── Feature 8: Notification Engine ───────────────────────────────
describe("Feature 8 — Notifications", () => {
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

  test("TC-U-23: EXPIRY_WARNING generated for urgent item", () => {
    const item = { _id: "item1", addedAt: daysAgo(6), shelfLifeDays: 7 };
    const result = shouldNotify(item, []);
    expect(result.generate).toBe(true);
    expect(result.type).toBe("EXPIRY_WARNING");
  });

  test("TC-U-24: No duplicate notification for same item", () => {
    const item = { _id: "item1", addedAt: daysAgo(6), shelfLifeDays: 7 };
    const existing = [{ itemId: "item1", type: "EXPIRY_WARNING" }];
    const result = shouldNotify(item, existing);
    expect(result.generate).toBe(false);
  });

  test("TC-U-24b: EXPIRED_ITEM alert generated for past-due item", () => {
    const item = { _id: "item2", addedAt: daysAgo(30), shelfLifeDays: 7 };
    const result = shouldNotify(item, []);
    expect(result.generate).toBe(true);
    expect(result.type).toBe("EXPIRED_ITEM");
  });
});

// ── Feature 9: Admin Role ─────────────────────────────────────────
describe("Feature 9 — Admin Authorization", () => {
  test("TC-U-25: Admin user passes role check", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
  });

  test("TC-U-26: Regular user fails role check", () => {
    expect(isAdmin({ role: "user" })).toBe(false);
  });
});

// ── Feature 10: Data Migration ───────────────────────────────────
describe("Feature 10 — Data Normalization Migration", () => {
  test("TC-U-27: STRAWBERRIES flagged as needing normalization", () => {
    const result = needsNormalization("STRAWBERRIES");
    expect(result.normalize).toBe(true);
    expect(result.singularName).toBe("STRAWBERRY");
  });

  test("TC-U-28: APPLE not flagged — already singular", () => {
    expect(needsNormalization("APPLE").normalize).toBe(false);
  });

  test("TC-U-28b: Merge action when singular already exists in DB", () => {
    expect(decideMergeAction("EGGS", "EGG", true).action).toBe("merge");
  });

  test("TC-U-28c: Rename action when no duplicate exists in DB", () => {
    expect(decideMergeAction("LENTILS", "LENTIL", false).action).toBe("rename");
  });
});
