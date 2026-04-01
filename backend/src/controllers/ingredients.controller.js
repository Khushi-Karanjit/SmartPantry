const Ingredient = require("../models/Ingredient");
const Category = require("../models/Category");

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeKeywords(list) {
  const set = new Set();
  (list || []).forEach((item) => {
    const value = normalizeName(item);
    if (value) set.add(value);
  });
  return Array.from(set);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getAllowedCategories() {
  const cats = await Category.find().select("name").lean();
  return cats.map((c) => c.name);
}

async function searchIngredients(req, res, next) {
  try {
    const qRaw = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const includeCustom =
      req.query.includeCustom === undefined ? true : String(req.query.includeCustom) !== "false";
    const limitRaw = Number(req.query.limit || 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 10;

    const query = {};
    if (category && category.toLowerCase() !== "all") {
      query.category = category;
    }
    if (!includeCustom) query.isCustom = false;

    if (qRaw) {
      const rx = new RegExp(escapeRegex(qRaw), "i");
      query.$or = [{ name: rx }, { keywords: rx }];
    }

    const candidates = await Ingredient.find(query)
      .select("name category defaultUnit shelfLifeDays isCustom")
      .limit(50)
      .lean();

    const qLower = qRaw.toLowerCase();
    const sorted = candidates.sort((a, b) => {
      const aPrefix = qLower && a.name.startsWith(qLower) ? 1 : 0;
      const bPrefix = qLower && b.name.startsWith(qLower) ? 1 : 0;
      if (aPrefix !== bPrefix) return bPrefix - aPrefix;
      if (a.isCustom !== b.isCustom) return a.isCustom ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    res.json({ ingredients: sorted.slice(0, limit) });
  } catch (err) {
    next(err);
  }
}

async function createCustomIngredient(req, res, next) {
  try {
    const { name, category, defaultUnit, shelfLifeDays, keywords } = req.body || {};

    const normalizedName = normalizeName(name);
    if (normalizedName.length < 2 || normalizedName.length > 60) {
      return res.status(400).json({ message: "Name must be 2-60 characters." });
    }

    const allowed = await getAllowedCategories();
    const categoryMatch = allowed.find((c) => c.toLowerCase() === String(category || "").toLowerCase());
    if (!categoryMatch) {
      return res.status(400).json({ message: "Invalid category." });
    }

    const shelfLife = Number(shelfLifeDays || 0);
    if (!Number.isFinite(shelfLife) || shelfLife < 0 || shelfLife > 365) {
      return res.status(400).json({ message: "shelfLifeDays must be 0-365." });
    }

    const normalizedKeywords = normalizeKeywords(keywords);

    const existing = await Ingredient.findOne({ name: normalizedName, category: categoryMatch }).lean();
    if (existing) {
      return res.json({ ingredient: existing });
    }

    const ingredient = await Ingredient.create({
      name: normalizedName,
      category: categoryMatch,
      defaultUnit: defaultUnit || "",
      shelfLifeDays: shelfLife,
      keywords: normalizedKeywords,
      isCustom: true,
      createdBy: req.userId || null,
    });

    res.status(201).json({ ingredient });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchIngredients, createCustomIngredient };
