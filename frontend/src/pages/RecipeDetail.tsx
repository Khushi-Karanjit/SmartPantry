import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getRecipeApi, type Recipe } from "../api/api";
import "../styles/recipes.css";

export default function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!id) throw new Error("Recipe id missing");
        const res = await getRecipeApi(id);
        if (active) {
          setRecipe(res.recipe);
          setServings(res.recipe.servings || 2);
        }
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load recipe");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  function adjustServings(delta: number) {
    if (!recipe) return;
    const base = recipe.servings || 2;
    const next = Math.max(1, servings + delta);
    const limit = Math.max(base * 3, 8);
    setServings(Math.min(limit, next));
  }

  function scaledQuantity(qty: number) {
    if (!recipe) return qty;
    const base = recipe.servings || 2;
    if (!qty) return qty;
    return Math.round((qty * servings * 100) / base) / 100;
  }

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <section className="card section recipe-detail">
        <div className="section-head">
          <h3 className="section-title">Recipe</h3>
          <Link to="/recipes" className="section-link">
            Back to recipes
          </Link>
        </div>

        {loading && <div className="section-body">Loading...</div>}
        {error && <div className="section-body">Error: {error}</div>}

        {recipe && (
          <div className="recipe-detail-body">
            <div className="recipe-detail-header">
              <h2>{recipe.name}</h2>
              <div className="recipe-detail-meta">
                {recipe.cuisine || "Global"} · {recipe.diet || "Balanced"} ·{" "}
                {recipe.prepMinutes ? `${recipe.prepMinutes} min` : "Quick prep"}
              </div>
              <div className="recipe-detail-portion">
                Portions:
                <button className="chip-btn" onClick={() => adjustServings(-1)}>
                  -
                </button>
                <span>{servings}</span>
                <button className="chip-btn" onClick={() => adjustServings(1)}>
                  +
                </button>
              </div>
              <p className="recipe-detail-desc">{recipe.description || "No description yet."}</p>
            </div>

            <div className="recipe-detail-grid">
              <div>
                <h4>Ingredients</h4>
                <ul className="recipe-list">
                  {(recipe.ingredients || []).map((ing, idx) => (
                    <li key={`${ing.name}-${idx}`}>
                      {scaledQuantity(ing.quantity)} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4>Steps</h4>
                <ol className="recipe-list">
                  {(recipe.steps || []).map((step, idx) => (
                    <li key={`${step}-${idx}`}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
