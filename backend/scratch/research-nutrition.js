const mongoose = require('mongoose');
const Recipe = require('../src/models/Recipe');
const UserPreference = require('../src/models/UserPreference');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function research() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const stats = await Recipe.aggregate([
            { $group: { 
                _id: null, 
                avgCal: { $avg: '$calories' }, 
                minCal: { $min: '$calories' }, 
                maxCal: { $max: '$calories' },
                count: { $sum: 1 } 
            }}
        ]);
        console.log('Recipe Stats:', JSON.stringify(stats, null, 2));

        const lowCal = await Recipe.countDocuments({ calories: { $lt: 500 } });
        console.log('Recipes < 500 kcal:', lowCal);

        const users = await UserPreference.find().limit(5).lean();
        console.log('Sample User Preferences:', JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

research();
