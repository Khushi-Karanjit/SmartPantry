const mongoose = require('mongoose');
const Recipe = require('../src/models/Recipe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanupJunk() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const junkPatterns = [
            /Expert Tutorial/i,
            /Backup Mode/i,
            /Classic Potato Recipe/i // This one was 510k, even though repaired it's still weird
        ];

        const recipes = await Recipe.find({
            $or: junkPatterns.map(p => ({ name: { $regex: p } }))
        });

        console.log(`Found ${recipes.length} junk recipes.`);

        for (const recipe of recipes) {
            console.log(`- Disabling: ${recipe.name}`);
            await Recipe.updateOne({ _id: recipe._id }, { 
                $set: { 
                    status: 'draft',
                    calories: 0, // Set to 0 to ensure they are never picked
                    name: `UNPUBLISHED: ${recipe.name}`
                } 
            });
        }

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanupJunk();
