const Category = require("../models/Category");

// GET /api/categories
async function listCategories(req, res) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    return res.json({ categories });
  } catch {
    return res.status(500).json({ message: "Failed to load categories" });
  }
}

// POST /api/categories (optional admin/seed use)
async function createCategory(req, res) {
  try {
    const { name, shelfLifeDays, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    const days = Number(shelfLifeDays);
    if (!Number.isFinite(days) || days < 1) {
      return res.status(400).json({ message: "shelfLifeDays must be a positive number" });
    }

    const cat = await Category.create({
      name: String(name).trim(),
      shelfLifeDays: days,
      description: description || "",
    });

    return res.status(201).json({ category: cat });
  } catch (err) {
    // duplicate name
    return res.status(400).json({ message: "Failed to create category" });
  }
}

module.exports = { listCategories, createCategory };
