const mongoose = require('mongoose');
const Recipe = require('../src/models/Recipe');
const PantryItem = require('../src/models/PantryItem');
const UserPreference = require('../src/models/UserPreference');
const { generatePlan } = require('../src/controllers/mealplans.controller');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Mock a request for the user reporting the issue
        const userId = "696a11b224c2d94833829de1"; // The reporting user
        const req = { userId };
        const res = {
            json: (data) => {
                console.log('\n--- Plan Verification Result ---');
                const day1 = data.plan.days[0];
                let total = 0;
                day1.meals.forEach(m => {
                    const servings = Math.max(1, m.recipeId.servings || 1);
                    const multiplier = m.servingsCount || 1;
                    const calPerServing = (m.recipeId.calories / servings) * multiplier;
                    total += calPerServing;
                    console.log(`Meal: ${m.recipeId.name} - ${calPerServing.toFixed(0)} kcal (${multiplier}x portion)`);
                });
                console.log(`\nDaily Total: ${total} kcal`);
                const target = 1585;
                const diff = Math.abs(total - target);
                const percent = (diff / target) * 100;
                console.log(`Target: ${target} kcal`);
                console.log(`Variance: ${percent.toFixed(1)}%`);
                
                if (percent < 15) console.log('✅ SUCCESS: Plan is within tolerance.');
                else console.log('❌ FAILURE: Plan is outside tolerance.');
            },
            status: (code) => ({ json: (data) => console.log('Error', code, data) })
        };

        await generatePlan(req, res, () => {});

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
