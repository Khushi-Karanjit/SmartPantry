import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getPantryItemsApi, listRecipesApi, type PantryItem, type Recipe } from "../api/api";

type RecipeMatch = Recipe & { match: number };

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function buildPantrySet(items: PantryItem[]) {
  const set = new Set<string>();
  items.forEach((item) => {
    if (item.ingredientId) set.add(item.ingredientId);
  });
  return set;
}

function computeMatch(recipe: Recipe, pantrySet: Set<string>) {
  const ingredients = recipe.ingredients || [];
  if (!ingredients.length) return 0;
  const matched = ingredients.filter((ing) => pantrySet.has(ing.ingredientId)).length;
  return Math.round((matched / ingredients.length) * 100);
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [servings, setServings] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [recipesRes, pantryRes] = await Promise.all([
          listRecipesApi(),
          getPantryItemsApi(),
        ]);
        if (!active) return;
        const list = recipesRes.recipes || [];
        setRecipes(list);
        setPantry(pantryRes.items || []);
        setSelectedId(list[0]?._id || null);
        setServings(list[0]?.servings || 2);
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load recipes");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const pantrySet = useMemo(() => buildPantrySet(pantry), [pantry]);

  const matches = useMemo<RecipeMatch[]>(() => {
    const base = recipes.map((recipe) => ({
      ...recipe,
      match: computeMatch(recipe, pantrySet),
    }));
    return base.sort((a, b) => b.match - a.match);
  }, [recipes, pantrySet]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return matches;
    return matches.filter((recipe) => normalize(recipe.name).includes(q));
  }, [matches, search]);

  const selected = useMemo(
    () => matches.find((recipe) => recipe._id === selectedId) || null,
    [matches, selectedId]
  );

  useEffect(() => {
    if (selected) setServings(selected.servings || 2);
  }, [selected?._id]);

  function adjustServings(delta: number) {
    const base = selected?.servings || 2;
    const next = Math.max(1, servings + delta);
    const limit = Math.max(base * 3, 8);
    setServings(Math.min(limit, next));
  }

  function scaledQuantity(qty: number) {
    const base = selected?.servings || 2;
    if (!qty) return qty;
    return Math.round((qty * servings * 100) / base) / 100;
  }

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <section className="card section recipe-browser">
        <div className="section-head">
          <h3 className="section-title">Recipe Browser</h3>
          <div className="section-sub">Discover meals based on your pantry items.</div>
        </div>

        {loading && <div className="section-body">Loading...</div>}
        {error && <div className="section-body">Error: {error}</div>}

        {!loading && !error && (
          <div className="browser-grid">
            <aside className="recipe-list">
              <div className="recipe-search">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search recipes..."
                />
              </div>
              <div className="recipe-stack">
                {filtered.map((recipe) => (
                  <button
                    key={recipe._id}
                    className={`recipe-row ${selectedId === recipe._id ? "active" : ""}`}
                    onClick={() => setSelectedId(recipe._id)}
                  >
                    <div>
                      <div className="recipe-row-title">{recipe.name}</div>
                      <div className="recipe-row-meta">
                        {recipe.prepMinutes ? `${recipe.prepMinutes} min` : "Quick"} ·{" "}
                        {recipe.diet || "Balanced"}
                      </div>
                    </div>
                    <span className="match-pill">{recipe.match}% Match</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="recipe-detail-panel">
              {selected ? (
                <>
                  <div className="panel-head">
                    <div>
                      <div className="panel-kicker">Recommended for you</div>
                      <h2>{selected.name}</h2>
                      <div className="panel-meta">
                        {selected.cuisine || "Global"} · {selected.diet || "Balanced"} ·{" "}
                        {selected.calories ? `${selected.calories} kcal` : "Calorie info pending"}
                      </div>
                    </div>
                    <span className="match-badge">{selected.match}% Match</span>
                  </div>

                  <div className="panel-stats">
                    <div className="stat-chip">
                      <div className="stat-label">Time</div>
                      <div className="stat-value">
                        {selected.prepMinutes ? `${selected.prepMinutes} min` : "Quick"}
                      </div>
                    </div>
                    <div className="stat-chip">
                      <div className="stat-label">Portions</div>
                      <div className="stat-value">
                        <button className="chip-btn" onClick={() => adjustServings(-1)}>
                          -
                        </button>
                        <span>{servings}</span>
                        <button className="chip-btn" onClick={() => adjustServings(1)}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="stat-chip">
                      <div className="stat-label">Difficulty</div>
                      <div className="stat-value">Easy</div>
                    </div>
                  </div>

                  <div className="panel-body">
                    <div className="panel-block">
                      <h4>Ingredients</h4>
                      <ul>
                        {(selected.ingredients || []).map((ing, idx) => (
                          <li key={`${ing.name}-${idx}`}>
                            {scaledQuantity(ing.quantity)} {ing.unit} {ing.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="panel-block">
                      <h4>Steps</h4>
                      <ol>
                        {(selected.steps || []).map((step, idx) => (
                          <li key={`step-${idx}`}>{step.text}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="panel-actions">
                    <Link className="primary-btn" to={`/recipes/${selected._id}`}>
                      Start cooking
                    </Link>
                    <Link className="ghost-btn" to="/meal-planner">
                      Add to weekly plan
                    </Link>
                  </div>
                </>
              ) : (
                <div className="section-body">Select a recipe to view details.</div>
              )}
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
