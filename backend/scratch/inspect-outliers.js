const mongoose = require('mongoose');
const Recipe = require('../src/models/Recipe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function targetInspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const names = [
            'Expert Tutorial Guide (Backup Mode)',
            'Creamy Garlic Parmesan Chicken Pasta'
        ];

        const recipes = await Recipe.find({ name: { $in: names } }).lean();
        
        console.log('Target Inspection:');
        recipes.forEach(r => {
            console.log(`\n--- ${r.name} ---`);
            console.log(`Calories: ${r.calories}, P: ${r.protein}, C: ${r.carbs}, F: ${r.fat}, Servings: ${r.servings}`);
            console.log('Ingredients:');
            (r.ingredients || []).forEach(ing => {
                console.log(`  - ${ing.name}: ${ing.quantity} ${ing.unit}`);
            });
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

targetInspect();
