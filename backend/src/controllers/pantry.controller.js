// backend/src/controllers/pantry.controller.js
const PantryPreset = require("../models/PantryPreset");
const PantryItem = require("../models/PantryItem");
const Category = require("../models/Category");
const Ingredient = require("../models/Ingredient");

/**
 * Compute expiry ISO date from a base date and shelf life days.
 */
function computeExpiryIso(baseDate, shelfLifeDays) {
  const base = new Date(baseDate);
  const expiry = new Date(base);
  expiry.setDate(expiry.getDate() + Number(shelfLifeDays || 0));
  return expiry.toISOString();
}

/**
 * Helper to calculate days from now until a date.
 */
function daysUntil(dateIso) {
  if (!dateIso) return 0;
  const now = new Date();
  const d = new Date(dateIso);
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * GET /api/pantry/presets
 */
async function getPresets(req, res) {
  try {
    const presets = await PantryPreset.find().sort({ title: 1 }).lean();
    return res.json({ presets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load presets" });
  }
}

/**
 * POST /api/pantry/initialize
 */
async function initializePantry(req, res) {
  try {
    const { presetKey, selectedNames } = req.body;
    if (!presetKey) return res.status(400).json({ message: "presetKey is required" });
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const preset = await PantryPreset.findOne({ key: presetKey }).lean();
    if (!preset) return res.status(404).json({ message: "Preset not found" });

    const existingPantryItems = await PantryItem.find({ userId }).select("ingredientId").lean();
    const existingIngredientIds = new Set(existingPantryItems.filter(it => it.ingredientId).map(it => it.ingredientId.toString()));

    const cats = await Category.find().lean();
    const catMap = new Map(cats.map(c => [String(c.name).toLowerCase(), c._id]));
    const otherId = catMap.get("other") || null;

    const docs = [];
    const itemsToProcess = Array.isArray(selectedNames) 
      ? (preset.items || []).filter(it => selectedNames.includes(it.name))
      : (preset.items || []);

    for (const it of itemsToProcess) {
      const catName = String(it.category || "Other");
      const categoryId = catMap.get(catName.toLowerCase()) || otherId;
      if (!categoryId) continue;

      const normalizedName = String(it.name || "").trim().toLowerCase();
      if (!normalizedName) continue;

      const ingredient = await Ingredient.findOneAndUpdate(
        { name: normalizedName, category: catName },
        {
          $setOnInsert: {
            name: normalizedName,
            category: catName,
            defaultUnit: it.unit || "pcs",
            shelfLifeDays: 0,
            keywords: [],
            isCustom: false,
          },
        },
        { new: true, upsert: true }
      );

      if (!ingredient || existingIngredientIds.has(ingredient._id.toString())) continue;

      docs.push({
        userId,
        name: ingredient.name,
        ingredientId: ingredient._id,
        categoryId,
        quantity: typeof it.quantity === "number" ? it.quantity : 1,
        unit: it.unit || ingredient.defaultUnit || "pcs",
        addedAt: new Date(),
        source: "preset",
        presetKey: preset.key,
      });
    }

    if (docs.length > 0) await PantryItem.insertMany(docs);
    return res.status(201).json({ message: "Pantry initialized successfully", count: docs.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to initialize pantry" });
  }
}

/**
 * GET /api/pantry
 * List items for the logged-in user with pagination and filtering.
 */
async function getPantryItems(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Pagination & Filtering Params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "All").trim();
    const tab = (req.query.tab || "all").trim();
    // Get Total Expiring Count (for the warning box)
    const allItems = await PantryItem.find({ userId })
      .populate("categoryId")
      .populate("ingredientId")
      .lean();
    
    const mappedAll = allItems.map(it => {
      const cat = it.categoryId || {};
      const ingredient = it.ingredientId || {};
      const shelfLife = ingredient.shelfLifeDays ?? cat.shelfLifeDays ?? 30;
      const base = it.addedAt || it.createdAt || new Date();
      return { _id: it._id, expiryDate: computeExpiryIso(base, shelfLife) };
    });

    const expiringSoonTotal = mappedAll.filter(it => {
      const d = daysUntil(it.expiryDate);
      return d >= 0 && d <= 2;
    }).length;

    // Build Query
    let query = { userId };
    const status = (req.query.status || "").trim();

    // If a specific status is requested (expiring/expired), we might need to filter the mapped results
    // For now, let's keep search/category query as is
    if (tab !== "all") query.presetKey = tab;
    if (search) query.name = { $regex: search, $options: "i" };
    if (category !== "All") {
      const catDoc = await Category.findOne({ name: category });
      if (catDoc) query.categoryId = catDoc._id;
    }

    // Fetch and Map for current page
    let finalItems = [];
    let totalCount = 0;

    if (status === "expiring") {
      // Special case: we filter the FULL Mapped results by expiration
      // Then we paginate that array. (Good for smaller pantries)
      const fullMapped = allItems.map((it) => {
        const cat = it.categoryId || {};
        const ingredient = it.ingredientId || {};
        const shelfLife = ingredient.shelfLifeDays ?? cat.shelfLifeDays ?? 30;
        const base = it.addedAt || it.createdAt || new Date();
        return {
          ...it,
          name: ingredient.name || it.name,
          category: ingredient.category || cat.name || "Other",
          expiryDate: computeExpiryIso(base, shelfLife),
        };
      }).filter(it => {
        const d = daysUntil(it.expiryDate);
        return d >= 0 && d <= 2;
      });

      totalCount = fullMapped.length;
      finalItems = fullMapped.slice((page - 1) * limit, page * limit);
    } else {
      // Normal paginated query
      totalCount = await PantryItem.countDocuments(query);
      const items = await PantryItem.find(query)
        .populate("categoryId")
        .populate("ingredientId")
        .sort({ addedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      finalItems = items.map((it) => {
        const cat = it.categoryId || {};
        const ingredient = it.ingredientId || {};
        const shelfLife = ingredient.shelfLifeDays ?? cat.shelfLifeDays ?? 30;
        const base = it.addedAt || it.createdAt || new Date();
        return {
          ...it,
          name: ingredient.name || it.name,
          category: ingredient.category || cat.name || "Other",
          expiryDate: computeExpiryIso(base, shelfLife),
        };
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({ 
      items: finalItems,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        expiringSoonCount: expiringSoonTotal
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load pantry items" });
  }
}

/**
 * POST /api/pantry
 */
async function addPantryItem(req, res) {
  try {
    const userId = req.userId;
    const { ingredientId, quantity, unit } = req.body;
    if (!ingredientId) return res.status(400).json({ message: "ingredientId is required" });

    const ingredient = await Ingredient.findById(ingredientId).lean();
    if (!ingredient) return res.status(400).json({ message: "Invalid ingredientId" });

    const categoryDoc = await Category.findOne({ name: ingredient.category }).lean();
    const q = Number(quantity ?? 1);

    const item = await PantryItem.create({
      userId,
      name: ingredient.name,
      ingredientId: ingredient._id,
      categoryId: categoryDoc?._id,
      quantity: q,
      unit: unit || ingredient.defaultUnit || "pcs",
      addedAt: new Date(),
      source: "manual",
    });

    return res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add pantry item" });
  }
}

/**
 * PATCH /api/pantry/:id
 */
async function updatePantryItem(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { ingredientId, quantity, unit } = req.body;

    const update = {};
    if (ingredientId !== undefined) {
      const ingredient = await Ingredient.findById(ingredientId).lean();
      if (!ingredient) return res.status(400).json({ message: "Invalid ingredientId" });
      const categoryDoc = await Category.findOne({ name: ingredient.category }).lean();
      update.ingredientId = ingredient._id;
      update.name = ingredient.name;
      update.categoryId = categoryDoc?._id;
      if (unit === undefined) update.unit = ingredient.defaultUnit || "pcs";
    }
    if (quantity !== undefined) update.quantity = Number(quantity);
    if (unit !== undefined) update.unit = unit;

    const item = await PantryItem.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    return res.json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update pantry item" });
  }
}

/**
 * DELETE /api/pantry/:id
 */
async function deletePantryItem(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const deleted = await PantryItem.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    return res.json({ message: "Item deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete pantry item" });
  }
}

/**
 * DELETE /api/pantry/cleanup
 */
async function cleanupExpiredItems(req, res) {
  try {
    const userId = req.userId;
    const items = await PantryItem.find({ userId }).populate("categoryId").populate("ingredientId").lean();
    const now = new Date();
    const expiredIds = items.filter(it => {
      const cat = it.categoryId || {};
      const ing = it.ingredientId || {};
      const shelfLife = ing.shelfLifeDays ?? cat.shelfLifeDays ?? 30;
      const base = it.addedAt || it.createdAt || new Date();
      const expiry = new Date(base);
      expiry.setDate(expiry.getDate() + Number(shelfLife));
      return expiry < now;
    }).map(it => it._id);

    if (expiredIds.length === 0) return res.json({ message: "No expired items found", count: 0 });
    const deleted = await PantryItem.deleteMany({ _id: { $in: expiredIds }, userId });
    return res.json({ message: `Cleaned up ${deleted.deletedCount} expired items`, count: deleted.deletedCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to cleanup items" });
  }
}

/**
 * PATCH /api/pantry/:id/restock
 */
async function restockPantryItem(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const item = await PantryItem.findOneAndUpdate({ _id: id, userId }, { $set: { addedAt: new Date() } }, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    return res.json({ message: "Item restocked successfully", item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to restock item" });
  }
}

module.exports = {
  getPresets,
  initializePantry,
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  cleanupExpiredItems,
  restockPantryItem,
};
