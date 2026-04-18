const Recipe = require("../models/Recipe");
const SavedRecipe = require("../models/SavedRecipe");
const { YoutubeTranscript } = require("youtube-transcript");
const aiService = require("../services/ai.service");
const { UNIT_MAPPING, normalizeCulinaryUnit } = require("../utils/culinaryMapping");

function extractVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

async function listRecipes(req, res, next) {
  try {
    const { page = 1, limit = 12, search = "", cuisine = "", hasVideo = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch user's pantry to perform global matching
    const PantryItem = require("../models/PantryItem");
    const mongoose = require("mongoose");
    const userObjectId = new mongoose.Types.ObjectId(String(req.userId));

    const pantry = await PantryItem.find({ userId: req.userId }).select("ingredientId").lean();
    
    // Crucial MongoDB Type Enforcement
    const pantryIngredientIds = pantry
      .filter(p => !!p.ingredientId)
      .map(p => {
        try { return new mongoose.Types.ObjectId(String(p.ingredientId)); } 
        catch (e) { return null; }
      })
      .filter(Boolean);

    const matchQuery = { status: "published" };
    if (search) {
      matchQuery.name = { $regex: search, $options: "i" };
    }
    if (cuisine) {
      matchQuery.cuisine = cuisine;
    }
    
    // Video Filter
    if (hasVideo === "with") {
      matchQuery.videoUrl = { $exists: true, $ne: "" };
    } else if (hasVideo === "without") {
      matchQuery.$or = [ { videoUrl: { $exists: false } }, { videoUrl: "" }, { videoUrl: null } ];
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $addFields: {
          matchedCount: {
            $size: {
              $setIntersection: [
                {
                  $map: {
                    input: { $ifNull: ["$ingredients", []] },
                    as: "ing",
                    in: "$$ing.ingredientId"
                  }
                },
                pantryIngredientIds
              ]
            }
          },
          totalIngredients: { $size: { $ifNull: ["$ingredients", []] } }
        }
      },
      {
        $addFields: {
          matchPercentage: {
            $cond: {
              if: { $gt: ["$totalIngredients", 0] },
              then: { $round: [ { $multiply: [ { $divide: ["$matchedCount", "$totalIngredients"] }, 100 ] }, 0 ] },
              else: 0
            }
          }
        }
      },
      {
        $lookup: {
          from: "savedrecipes",
          let: { recipeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", userObjectId] },
                    { $eq: ["$recipeId", "$$recipeId"] }
                  ]
                }
              }
            }
          ],
          as: "savedStatus"
        }
      },
      {
        $addFields: {
          isSaved: { $gt: [{ $size: "$savedStatus" }, 0] }
        }
      },
      { $sort: { matchPercentage: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const [recipes, totalCount] = await Promise.all([
      Recipe.aggregate(pipeline),
      Recipe.countDocuments(matchQuery)
    ]);

    res.json({
      recipes,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        hasMore: skip + recipes.length < totalCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    
    // Check if saved
    const isSaved = await SavedRecipe.exists({ userId: req.userId, recipeId: recipe._id });
    
    res.json({ recipe: { ...recipe, isSaved: !!isSaved } });
  } catch (err) {
    next(err);
  }
}

async function createRecipe(req, res, next) {
  try {
    const payload = req.body || {};
    if (!payload.name) return res.status(400).json({ message: "name is required" });
    const recipe = await Recipe.create(payload);
    res.status(201).json({ recipe });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation Error", 
        details: Object.values(err.errors).map(e => e.message) 
      });
    }
    next(err);
  }
}

async function updateRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body || {}, {
      new: true,
      runValidators: true,
    });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json({ recipe });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation Error", 
        details: Object.values(err.errors).map(e => e.message) 
      });
    }
    next(err);
  }
}

async function deleteRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function toggleSaveRecipe(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await SavedRecipe.findOne({ userId: req.userId, recipeId: id });
    if (existing) {
      await SavedRecipe.deleteOne({ _id: existing._id });
      return res.json({ saved: false });
    }
    await SavedRecipe.create({ userId: req.userId, recipeId: id });
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
}

async function getSavedRecipes(req, res, next) {
  try {
    const saved = await SavedRecipe.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("recipeId")
      .lean();
    // Return just the recipe objects for easier frontend consumption
    res.json({ recipes: saved.map(s => s.recipeId).filter(Boolean) });
  } catch (err) {
    next(err);
  }
}

async function suggestRecipes(req, res, next) {
  try {
    const { ingredientIds } = req.query;
    if (!ingredientIds) {
      return res.status(400).json({ message: "ingredientIds query parameter is required" });
    }

    const selectedIds = ingredientIds.split(",").filter((id) => id.length > 0);
    if (selectedIds.length === 0) {
      return res.json({ recipes: [] });
    }

    const recipes = await Recipe.find({ status: "published" }).lean();
    
    const suggested = recipes.map(recipe => {
      // Ensure we compare strings
      const recipeIngredientIds = recipe.ingredients.map(ing => String(ing.ingredientId));
      const matchedIngredients = selectedIds.filter(id => recipeIngredientIds.includes(String(id)));
      
      const matchPercentage = recipe.ingredients.length > 0 
        ? Math.round((matchedIngredients.length / recipe.ingredients.length) * 100)
        : 0;

      return {
        ...recipe,
        matchPercentage,
        matchedCount: matchedIngredients.length
      };
    })
    .filter(recipe => recipe.matchedCount > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage || b.matchedCount - a.matchedCount);
    res.json({ recipes: suggested });
  } catch (err) {
    next(err);
  }
}

async function listCuisines(req, res, next) {
  try {
    const cuisines = await Recipe.distinct("cuisine", { status: "published" });
    res.json({ cuisines: cuisines.filter(Boolean).sort() });
  } catch (err) {
    next(err);
  }
}

async function processVideo(req, res, next) {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ message: "videoUrl is required" });

    const videoId = extractVideoId(videoUrl);
    if (!videoId) return res.status(400).json({ message: "Invalid YouTube URL" });

    // Fetch transcript from YouTube
    let transcript;
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    } catch (err) {
      console.warn("English transcript failed, trying default...", err.message);
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (err2) {
        console.error("YouTube Transcript Library Error:", err2.message);
        return res.status(400).json({ 
          message: "Could not find a transcript for this video. Please ensure the video has English captions/subtitles enabled." 
        });
      }
    }

    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ 
        message: "This video has no transcript data available. Please try another recipe video." 
      });
    }
    
    // Process with AI for full recipe data
    const fullRecipe = await aiService.extractFullRecipeFromTranscript(transcript);
    
    // Auto-match ingredients to DB to get real macros
    const Ingredient = require("../models/Ingredient");
    const { calculateRecipeMacros } = require("../services/nutrition.service");

    // DEDUPLICATION: Merge identical ingredients coming from the AI array
    const dedupMap = new Map();
    (fullRecipe.ingredients || []).forEach(ing => {
       const normalized = ing.name.toLowerCase().trim();
       if (dedupMap.has(normalized)) {
          const existing = dedupMap.get(normalized);
          existing.quantity += (ing.quantity || 1);
       } else {
          dedupMap.set(normalized, { ...ing });
       }
    });
    
    let parsedIngredients = Array.from(dedupMap.values());

    // USER OVERRIDE: Enforce strict Sugar sizing
    parsedIngredients.forEach(ing => {
       if (ing.name.toLowerCase().includes("sugar")) {
          if (ing.quantity < 10) {
             ing.unit = "tsp";
          } else {
             ing.unit = "gram";
          }
       }
    });
    
    const enrichedIngredients = await Promise.all(
      parsedIngredients.map(async (ing) => {
        // Try exact match first (case-insensitive)
        let match = await Ingredient.findOne({ 
          name: { $regex: new RegExp(`^${ing.name}$`, "i") } 
        });

        // Fuzzy fallback: If no exact match, try searching if DB entry is CALLED the extracted name
        if (!match) {
          match = await Ingredient.findOne({ 
            $or: [
              { name: { $regex: new RegExp(ing.name, "i") } },
              { keywords: { $in: [new RegExp(ing.name, "i")] } }
            ]
          });
        }

        if (match) {
          // ENSURE UNIT CORRESPONDENCE: If DB has a preferred unit (e.g. tsp for salt), 
          // and AI gave something generic like "pcs" or absurd like "cup", prioritize the DB standard.
          let finalUnit = ing.unit;
          const volWeightUnits = ["g", "ml", "tsp", "tbsp", "gram", "ounce", "lb", "kg"];
          
          if (match.defaultUnit) {
             const lowerAIUnit = (ing.unit || "").toLowerCase();
             const lowerDBUnit = match.defaultUnit.toLowerCase();

             // CASE 1: AI says "pcs" or "cup" but DB says volume/weight
             if (volWeightUnits.includes(lowerDBUnit) && (lowerAIUnit === "pcs" || lowerAIUnit === "cup" || !lowerAIUnit)) {
                finalUnit = match.defaultUnit;
             }
             
             // CASE 2: Micro-ingredient enforcement (salt, spices)
             const microItems = ["salt", "pepper", "baking", "yeast", "cinnamon", "spice", "powder"];
             if (microItems.some(m => match.name.toLowerCase().includes(m))) {
                if (lowerAIUnit === "pcs" || lowerAIUnit === "cup" || !lowerAIUnit) {
                   finalUnit = match.defaultUnit;
                }
             }

             // CASE 3: EXHAUSTIVE USER MAPPING OVERRIDE (New)
             // Even if DB match found, if User specified a preferred unit for this item, use it.
             const userPreferred = normalizeCulinaryUnit(match.name, finalUnit, ing.quantity);
             if (userPreferred.unit !== finalUnit) {
                finalUnit = userPreferred.unit;
             }
          }

          return { 
            ...ing, 
            ingredientId: match._id, 
            name: match.name,
            unit: finalUnit
          };
        }
        return ing;
      })
    );

    const macros = await calculateRecipeMacros(enrichedIngredients);
    fullRecipe.calories = macros.calories;
    fullRecipe.protein = macros.protein;
    fullRecipe.carbs = macros.carbs;
    fullRecipe.fat = macros.fat;
    fullRecipe.ingredients = enrichedIngredients;

    res.json({ recipe: fullRecipe });
  } catch (err) {
    console.error("Video processing error:", err);
    res.status(500).json({ message: err.message || "Failed to process video transcript" });
  }
}

module.exports = { 
  listRecipes, 
  getRecipe, 
  createRecipe, 
  updateRecipe, 
  deleteRecipe,
  toggleSaveRecipe,
  getSavedRecipes,
  suggestRecipes,
  listCuisines,
  processVideo
};
