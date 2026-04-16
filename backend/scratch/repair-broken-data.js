const mongoose = require('mongoose');
const Recipe = require('../src/models/Recipe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CAL_MAP = {
    protein: 4,
    carbs: 4,
    fat: 9
};

// Heuristic: Max reasonable quantity per serving for various units
const LIMITS = {
    'cup': 5,      // >5 cups of anything per serving is suspicious
    'tsp': 50,
    'tbsp': 30,
    'pcs': 20
};

async function repairData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const recipes = await Recipe.find({ 
            $or: [
                { calories: { $gt: 1500 } },
                { protein: { $gt: 300 } },
                { carbs: { $gt: 500 } }
            ]
        });

        console.log(`Found ${recipes.length} suspicious recipes.`);

        for (const recipe of recipes) {
            console.log(`Analyzing: ${recipe.name} (${recipe.calories} kcal)`);
            let modified = false;
            const servings = recipe.servings || 1;

            (recipe.ingredients || []).forEach(ing => {
                const qtyPerServing = (ing.quantity || 0) / servings;
                const unit = (ing.unit || "").toLowerCase();

                // FIX 1: The "Cups instead of Grams" artifact
                if ((unit === 'cup' || unit === 'cups') && qtyPerServing > 10) {
                    console.log(`  - Fixing unit: ${ing.name} ${ing.quantity} ${ing.unit} -> ${ing.quantity} grams`);
                    ing.unit = 'gram';
                    modified = true;
                }

                // FIX 2: Oregano/Spice inflation (ml instead of tsp/pinch)
                if (['oregano', 'salt', 'pepper', 'thyme', 'yeast', 'sugar'].some(s => ing.name.toLowerCase().includes(s))) {
                    if (unit === 'ml' && (ing.quantity || 0) > 50) {
                         console.log(`  - Fixing spice inflation: ${ing.name} ${ing.quantity}ml -> ${Math.ceil(ing.quantity/50)} tsp`);
                         ing.quantity = Math.ceil(ing.quantity / 50);
                         ing.unit = 'tsp';
                         modified = true;
                    }
                }
            });

            if (modified || recipe.calories > 10000) {
                // RECALCULATE MACROS
                // Since we don't have a full per-ingredient database, we'll use a conservative scaling
                // if the macros are still insane even after unit fixes.
                
                if (recipe.calories > 5000) {
                    console.log(`  - Macros still insane. Capping to realistic max for ${recipe.name}`);
                    recipe.calories = 850;
                    recipe.protein = 45;
                    recipe.carbs = 90;
                    recipe.fat = 30;
                } else if (modified) {
                    // If we fixed units but macros are still high, we should ideally re-calc
                    // for now, we'll trust the modified state but cap very high ones
                    if (recipe.calories > 2500) {
                        recipe.calories = Math.round(recipe.calories / 3);
                        recipe.protein = Number((recipe.protein / 3).toFixed(1));
                        recipe.carbs = Number((recipe.carbs / 3).toFixed(1));
                        recipe.fat = Number((recipe.fat / 3).toFixed(1));
                    }
                }
                
                await Recipe.updateOne({ _id: recipe._id }, { 
                    $set: { 
                        ingredients: recipe.ingredients,
                        calories: recipe.calories,
                        protein: recipe.protein,
                        carbs: recipe.carbs,
                        fat: recipe.fat,
                        description: recipe.description + " (Heuristically repaired)"
                    } 
                });
                console.log(`  [REPAIRED] -> ${recipe.calories} kcal`);
            }
        }

        console.log('Repair complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

repairData();
