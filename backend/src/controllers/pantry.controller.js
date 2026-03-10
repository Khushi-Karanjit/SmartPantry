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
 * GET /api/pantry/presets
 * Returns preset templates (still used for Pantry Setup page).
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
 * body: { presetKey: "student" | "nepali" | ... }
 *
 * Option B: categories have fixed shelf life in Category collection.
 * Preset items should include category name; we map it to categoryId.
 */
async function initializePantry(req, res) {
  try {
    const { presetKey } = req.body;

    if (!presetKey) {
      return res.status(400).json({ message: "presetKey is required" });
    }

    const userId = req.userId; // from middleware
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const preset = await PantryPreset.findOne({ key: presetKey }).lean();
    if (!preset) {
      return res.status(404).json({ message: "Preset not found" });
    }

    // SMART MERGE: Get existing items for this user to avoid duplicates
    const existingPantryItems = await PantryItem.find({ userId }).select("ingredientId").lean();
    const existingIngredientIds = new Set(
      existingPantryItems
        .filter((it) => it.ingredientId)
        .map((it) => it.ingredientId.toString())
    );

    // Build a category name -> _id map once for faster inserts
    const cats = await Category.find().lean();
    const catMap = new Map(cats.map((c) => [String(c.name).toLowerCase(), c._id]));
    const otherId = catMap.get("other") || null;

    const docs = [];

    for (const it of preset.items || []) {
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

      if (!ingredient) {
        console.warn(`[initializePantry] Could not resolve ingredient: ${normalizedName}`);
        continue;
      }

      // Skip if this ingredient is already in the user's pantry
      if (existingIngredientIds.has(ingredient._id.toString())) {
        continue;
      }

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

    // Guard: if you have no "Other" category seeded, this will fail
    // because categoryId is required. Better to error clearly:
    if (docs.some((d) => !d.categoryId)) {
      return res.status(400).json({
        message:
          'Category mapping failed. Ensure categories are seeded (including "Other") and preset items use valid category names.',
      });
    }

    if (docs.length > 0) {
      console.log(`[initializePantry] Attempting to insert ${docs.length} items for user ${userId}`);
      await PantryItem.insertMany(docs);
    } else {
      console.log(`[initializePantry] No new items to insert for user ${userId}`);
    }

    return res.status(201).json({
      message: "Pantry initialized successfully",
      count: docs.length,
    });
  } catch (err) {
    console.error("[initializePantry] Error:", err);
    return res.status(500).json({ 
      message: "Failed to initialize pantry",
      error: err.message 
    });
  }
}

/**
 * GET /api/pantry
 * List items for the logged-in user.
 * Returns computed expiryDate based on Category.shelfLifeDays and PantryItem.addedAt.
 */
async function getPantryItems(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const items = await PantryItem.find({ userId })
      .populate("categoryId")
      .populate("ingredientId")
      .sort({ addedAt: -1, createdAt: -1 })
      .lean();

    const mapped = items.map((it) => {
      const cat = it.categoryId || {};
      const ingredient = it.ingredientId || {};
      const shelfLifeDays = ingredient.shelfLifeDays ?? cat.shelfLifeDays ?? 30;
      const base = it.addedAt || it.createdAt || new Date();

      return {
        ...it,
        ingredientId: ingredient._id ? ingredient._id.toString() : it.ingredientId,
        name: ingredient.name || it.name,
        category: ingredient.category || cat.name || "Other",
        shelfLifeDays,
        expiryDate: computeExpiryIso(base, shelfLifeDays),
      };
    });

    return res.json({ items: mapped });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load pantry items" });
  }
}

/**
 * POST /api/pantry
 * body: { name, categoryId, quantity, unit }
 * No per-item expiry input.
 */
async function addPantryItem(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { ingredientId, quantity, unit } = req.body;

    if (!ingredientId) {
      return res.status(400).json({ message: "ingredientId is required" });
    }

    const ingredient = await Ingredient.findById(ingredientId).lean();
    if (!ingredient) {
      return res.status(400).json({ message: "Invalid ingredientId" });
    }

    const categoryDoc = await Category.findOne({ name: ingredient.category }).lean();
    if (!categoryDoc) {
      return res.status(400).json({ message: "Invalid ingredient category" });
    }

    const q = Number(quantity ?? 1);
    if (Number.isNaN(q) || q < 0) {
      return res.status(400).json({ message: "Quantity must be a non-negative number" });
    }

    const item = await PantryItem.create({
      userId,
      name: ingredient.name,
      ingredientId: ingredient._id,
      categoryId: categoryDoc._id,
      quantity: q,
      unit: unit || ingredient.defaultUnit || "pcs",
      addedAt: new Date(),
      source: "manual",
      presetKey: null,
    });

    return res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add pantry item" });
  }
}

/**
 * PATCH /api/pantry/:id
 * body can include: { name, categoryId, quantity, unit }
 * No expiryDate here; expiry is computed.
 */
async function updatePantryItem(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { ingredientId, quantity, unit } = req.body;

    const update = {};

    if (ingredientId !== undefined) {
      const ingredient = await Ingredient.findById(ingredientId).lean();
      if (!ingredient) return res.status(400).json({ message: "Invalid ingredientId" });
      const categoryDoc = await Category.findOne({ name: ingredient.category }).lean();
      if (!categoryDoc) {
        return res.status(400).json({ message: "Invalid ingredient category" });
      }
      update.ingredientId = ingredient._id;
      update.name = ingredient.name;
      update.categoryId = categoryDoc._id;
      if (unit === undefined) {
        update.unit = ingredient.defaultUnit || "pcs";
      }
    }

    if (quantity !== undefined) {
      const q = Number(quantity);
      if (Number.isNaN(q) || q < 0) {
        return res.status(400).json({ message: "Quantity must be a non-negative number" });
      }
      update.quantity = q;
    }

    if (unit !== undefined) {
      update.unit = unit || "pcs";
    }

    const item = await PantryItem.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

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
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const deleted = await PantryItem.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.json({ message: "Item deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete pantry item" });
  }
}

module.exports = {
  getPresets,
  initializePantry,
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
};

