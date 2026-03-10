const UserPreference = require("../models/UserPreference");

const DEFAULT_PREFS = {
  diet: "",
  cuisines: [],
  allergies: [],
  excludeIngredients: [],
  maxPrepMinutes: 0,
  mealsPerDay: 2,
  repeatLimitWeekly: 2,
  caloriesTarget: 0,
  proteinTarget: 0,
  carbsTarget: 0,
  fatTarget: 0,
};

async function getPreferences(req, res, next) {
  try {
    const prefs = await UserPreference.findOne({ userId: req.userId }).lean();
    res.json({ preferences: prefs || DEFAULT_PREFS });
  } catch (err) {
    next(err);
  }
}

async function upsertPreferences(req, res, next) {
  try {
    const payload = req.body || {};
    const update = {
      diet: payload.diet ?? DEFAULT_PREFS.diet,
      cuisines: payload.cuisines ?? DEFAULT_PREFS.cuisines,
      allergies: payload.allergies ?? DEFAULT_PREFS.allergies,
      excludeIngredients: payload.excludeIngredients ?? DEFAULT_PREFS.excludeIngredients,
      maxPrepMinutes: payload.maxPrepMinutes ?? DEFAULT_PREFS.maxPrepMinutes,
      mealsPerDay: payload.mealsPerDay ?? DEFAULT_PREFS.mealsPerDay,
      repeatLimitWeekly: payload.repeatLimitWeekly ?? DEFAULT_PREFS.repeatLimitWeekly,
      caloriesTarget: payload.caloriesTarget ?? DEFAULT_PREFS.caloriesTarget,
      proteinTarget: payload.proteinTarget ?? DEFAULT_PREFS.proteinTarget,
      carbsTarget: payload.carbsTarget ?? DEFAULT_PREFS.carbsTarget,
      fatTarget: payload.fatTarget ?? DEFAULT_PREFS.fatTarget,
    };
    const prefs = await UserPreference.findOneAndUpdate(
      { userId: req.userId },
      { $set: update, $setOnInsert: { userId: req.userId } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ preferences: prefs });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPreferences, upsertPreferences };
