import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import PageSkeleton from "../components/PageSkeleton";
import {
  generateMealPlanApi,
  getCurrentMealPlanApi,
  getPreferencesApi,
  listRecipesApi,
  listCuisinesApi,
  savePreferencesApi,
  type MealPlan,
  type Preferences,
  type Recipe,
  type ShoppingList,
} from "../api/api";
import "../styles/MealPlanner.css";

const DEFAULT_PREFS: Preferences = {
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

function joinList(list: string[]) {
  return list.join(", ");
}

function splitList(text: string) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function MealPlanner() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [allergiesText, setAllergiesText] = useState("");
  const [excludeText, setExcludeText] = useState("");
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const [prefsRes, planRes, recipesRes, cuisinesRes] = await Promise.all([
          getPreferencesApi(),
          getCurrentMealPlanApi(),
          listRecipesApi(),
          listCuisinesApi(),
        ]);
        if (!active) return;
        const loaded = prefsRes.preferences || DEFAULT_PREFS;
        setPrefs(loaded);
        setAllergiesText(joinList(loaded.allergies));
        setExcludeText(joinList(loaded.excludeIngredients));
        setPlan(planRes.plan);
        setShoppingList(planRes.shoppingList);
        setRecipes(recipesRes.recipes || []);
        setAvailableCuisines(cuisinesRes.cuisines || []);
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load meal planner");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach((r) => map.set(r._id, r));
    return map;
  }, [recipes]);

  async function saveAndGenerate() {
    setSaving(true);
    setError(null);
    try {
      const payload: Preferences = {
        ...prefs,
        allergies: splitList(allergiesText),
        excludeIngredients: splitList(excludeText),
      };
      const saved = await savePreferencesApi(payload);
      setPrefs(saved.preferences);
      const generated = await generateMealPlanApi();
      setPlan(generated.plan);
      setShoppingList(generated.shoppingList);
    } catch (e: any) {
      setError(e?.message || "Failed to generate meal plan");
    } finally {
      setSaving(false);
    }
  }

  function toggleCuisine(cuisine: string) {
    if (!cuisine) return;
    const next = prefs.cuisines.includes(cuisine)
      ? prefs.cuisines.filter((c) => c !== cuisine)
      : [...prefs.cuisines, cuisine];
    setPrefs({ ...prefs, cuisines: next });
  }

  function useRecommendedDefaults() {
    setPrefs({
      ...prefs,
      caloriesTarget: 2000,
      proteinTarget: 150,
      carbsTarget: 200,
      fatTarget: 67,
    });
  }

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      {loading ? (
        <PageSkeleton cards={3} />
      ) : (
        <>
          <div className="meal-grid">
            <section className="card section meal-card">
              <div className="section-head">
                <h3 className="section-title">Meal Plan Preferences</h3>
              </div>

              <div className="meal-form">
                <label>
                  Diet
                  <select
                    value={prefs.diet}
                    onChange={(e) => setPrefs({ ...prefs, diet: e.target.value })}
                  >
                    <option value="">No preference</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="pescatarian">Pescatarian</option>
                    <option value="keto">Keto</option>
                    <option value="low-carb">Low Carb</option>
                  </select>
                </label>

                <label>
                  Preferred cuisines
                  <div className="cuisine-selection">
                    <select
                      value=""
                      onChange={(e) => toggleCuisine(e.target.value)}
                      className="cuisine-select"
                    >
                      <option value="">Add a cuisine...</option>
                      {availableCuisines
                        .filter((c) => !prefs.cuisines.includes(c))
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                    <div className="cuisine-tags">
                      {prefs.cuisines.map((c) => (
                        <span key={c} className="cuisine-tag">
                          {c}
                          <button
                            type="button"
                            className="tag-remove"
                            onClick={() => toggleCuisine(c)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </label>

                <label>
                  Allergies
                  <input
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    placeholder="Peanuts, dairy"
                  />
                </label>

                <label>
                  Exclude ingredients
                  <input
                    value={excludeText}
                    onChange={(e) => setExcludeText(e.target.value)}
                    placeholder="Mushrooms, olives"
                  />
                </label>

                <div className="meal-row">
                  <label>
                    Max prep time (minutes)
                    <input
                      type="number"
                      min={0}
                      value={prefs.maxPrepMinutes}
                      onChange={(e) =>
                        setPrefs({ ...prefs, maxPrepMinutes: Number(e.target.value || 0) })
                      }
                    />
                  </label>

                  <label>
                    Meals per day
                    <select
                      value={prefs.mealsPerDay}
                      onChange={(e) => setPrefs({ ...prefs, mealsPerDay: Number(e.target.value) })}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </label>
                </div>

                <label>
                  Repeat limit per week
                  <select
                    value={prefs.repeatLimitWeekly}
                    onChange={(e) =>
                      setPrefs({ ...prefs, repeatLimitWeekly: Number(e.target.value) })
                    }
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </label>

                <div className="meal-row">
                  <label>
                    Calories target (per day)
                    <input
                      type="number"
                      min={0}
                      value={prefs.caloriesTarget}
                      onChange={(e) =>
                        setPrefs({ ...prefs, caloriesTarget: Number(e.target.value || 0) })
                      }
                    />
                  </label>

                  <label>
                    Protein target (g)
                    <input
                      type="number"
                      min={0}
                      value={prefs.proteinTarget}
                      onChange={(e) =>
                        setPrefs({ ...prefs, proteinTarget: Number(e.target.value || 0) })
                      }
                    />
                  </label>
                </div>

                <div className="meal-row">
                  <label>
                    Carbs target (g)
                    <input
                      type="number"
                      min={0}
                      value={prefs.carbsTarget}
                      onChange={(e) =>
                        setPrefs({ ...prefs, carbsTarget: Number(e.target.value || 0) })
                      }
                    />
                  </label>

                  <label>
                    Fat target (g)
                    <input
                      type="number"
                      min={0}
                      value={prefs.fatTarget}
                      onChange={(e) =>
                        setPrefs({ ...prefs, fatTarget: Number(e.target.value || 0) })
                      }
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={useRecommendedDefaults}
                >
                  Use Recommended Defaults
                </button>

                {error && <div className="err">{error}</div>}

                <button className="primary-btn" onClick={saveAndGenerate} disabled={saving}>
                  {saving ? "Generating..." : "Generate Weekly Plan"}
                </button>
              </div>
            </section>

            <section className="card section meal-card">
              <div className="section-head">
                <h3 className="section-title">Your Weekly Plan</h3>
                {plan && <span className="meal-meta">Week of {formatDate(plan.weekStart)}</span>}
              </div>

              {!plan && (
                <div className="section-body">No plan yet. Generate your first plan.</div>
              )}

              {plan && (
                <div className="meal-plan">
                  {plan.days.map((day) => (
                    <div className="meal-day" key={day.date}>
                      <div className="meal-date">{formatDate(day.date)}</div>
                      <div className="meal-meals">
                        {day.meals.map((meal) => {
                          const recipe = recipeMap.get(meal.recipeId);
                          return (
                            <div className="meal-item" key={`${day.date}-${meal.mealType}`}>
                              <div className="meal-type">{meal.mealType}</div>
                              <Link className="meal-link" to={`/recipes/${meal.recipeId}`}>
                                {recipe?.name || "View recipe"}
                              </Link>
                              <div className="meal-sub">
                                {recipe?.cuisine || "SmartPantry"} -{" "}
                                {recipe?.prepMinutes ? `${recipe.prepMinutes} min` : "Quick"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="card section meal-card">
            <div className="section-head">
              <h3 className="section-title">Shopping List</h3>
              <span className="meal-meta">Auto-generated from missing ingredients</span>
            </div>

            {!shoppingList || !shoppingList.items.length ? (
              <div className="section-body">Your pantry covers this week. No extras needed.</div>
            ) : (
              <div className="shopping-list">
                {shoppingList.items.map((item) => (
                  <div className="shopping-item" key={item.name}>
                    <div className="shopping-name">{item.name}</div>
                    <div className="shopping-qty">
                      {item.quantity} {item.unit || ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
