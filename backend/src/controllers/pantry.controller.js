// backend/src/controllers/pantry.controller.js
const PantryPreset = require("../models/PantryPreset");
const PantryItem = require("../models/PantryItem");
const Category = require("../models/Category");

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

    const existingCount = await PantryItem.countDocuments({ userId });
    if (existingCount > 0) {
      return res.status(409).json({ message: "Pantry already initialized" });
    }

    // Build a category name -> _id map once for faster inserts
    const cats = await Category.find().lean();
    const catMap = new Map(cats.map((c) => [String(c.name).toLowerCase(), c._id]));
    const otherId = catMap.get("other") || null;

    const docs = (preset.items || []).map((it) => {
      const catName = String(it.category || "Other");
      const categoryId = catMap.get(catName.toLowerCase()) || otherId;

      return {
        userId,
        name: it.name,
        categoryId, // Option B ref
        quantity: typeof it.quantity === "number" ? it.quantity : 1,
        unit: it.unit || "pcs",
        addedAt: new Date(), // base date for shelf-life
        source: "preset",
        presetKey: preset.key,
      };
    });

    // Guard: if you have no "Other" category seeded, this will fail
    // because categoryId is required. Better to error clearly:
    if (docs.some((d) => !d.categoryId)) {
      return res.status(400).json({
        message:
          'Category mapping failed. Ensure categories are seeded (including "Other") and preset items use valid category names.',
      });
    }

    await PantryItem.insertMany(docs);

    return res.status(201).json({
      message: "Pantry initialized successfully",
      count: docs.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to initialize pantry" });
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
      .populate("categoryId") // expects Category model
      .sort({ addedAt: -1, createdAt: -1 })
      .lean();

    const mapped = items.map((it) => {
      const cat = it.categoryId || {};
      const shelfLifeDays = cat.shelfLifeDays ?? 30;
      const base = it.addedAt || it.createdAt || new Date();

      return {
        ...it,
        category: cat.name || "Other",
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

    const { name, categoryId, quantity, unit } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Item name is required" });
    }

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    // Ensure category exists (avoids dangling refs)
    const catExists = await Category.exists({ _id: categoryId });
    if (!catExists) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    const q = Number(quantity ?? 1);
    if (Number.isNaN(q) || q < 0) {
      return res.status(400).json({ message: "Quantity must be a non-negative number" });
    }

    const item = await PantryItem.create({
      userId,
      name: String(name).trim(),
      categoryId,
      quantity: q,
      unit: unit || "pcs",
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
    const { name, categoryId, quantity, unit } = req.body;

    const update = {};

    if (name !== undefined) {
      const n = String(name).trim();
      if (!n) return res.status(400).json({ message: "Item name cannot be empty" });
      update.name = n;
    }

    if (categoryId !== undefined) {
      const catExists = await Category.exists({ _id: categoryId });
      if (!catExists) return res.status(400).json({ message: "Invalid categoryId" });
      update.categoryId = categoryId;
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

