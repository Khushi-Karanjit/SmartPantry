import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Sparkles, 
  X, 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  Loader2
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import IngredientSearchSelect from "../components/IngredientSearchSelect";
import { suggestRecipesApi, getPantryItemsApi } from "../api/api";
import type { Recipe, Ingredient, PantryItem } from "../api/api";
import "../styles/RecipeSuggester.css";

export default function RecipeSuggester() {
  const navigate = useNavigate();
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  useEffect(() => {
    fetchPantry();
  }, []);

  const fetchPantry = async () => {
    try {
      const res = await getPantryItemsApi();
      const items = res.items || [];
      setPantryItems(items);
      
      // Auto-suggest using pantry items on load
      if (items.length > 0) {
        const fromPantry: Ingredient[] = items.map(item => ({
          _id: item.ingredientId,
          name: item.name,
          category: item.category,
          defaultUnit: item.unit,
          shelfLifeDays: 0,
          isCustom: false
        }));
        setSelectedIngredients(fromPantry);
        
        // Immediate suggestion
        const ids = fromPantry.map(i => i._id);
        const suggRes = await suggestRecipesApi(ids);
        setSuggestedRecipes(suggRes.recipes);
      }
    } catch (err) {
      console.error("Failed to fetch pantry", err);
    }
  };

  const addIngredient = (ing: Ingredient | null) => {
    if (!ing) return;
    if (selectedIngredients.find(i => i._id === ing._id)) return;
    setSelectedIngredients([...selectedIngredients, ing]);
  };

  const removeIngredient = (id: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i._id !== id));
  };

  const handleSuggest = async () => {
    if (selectedIngredients.length === 0) return;
    
    setLoading(true);
    try {
      const ids = selectedIngredients.map(i => i._id);
      const res = await suggestRecipesApi(ids);
      setSuggestedRecipes(res.recipes);
    } catch (err) {
      console.error("Failed to get suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  const addAllFromPantry = () => {
    const fromPantry: Ingredient[] = pantryItems.map(item => ({
      _id: item.ingredientId,
      name: item.name,
      category: item.category,
      defaultUnit: item.unit,
      shelfLifeDays: 0,
      isCustom: false
    }));
    
    const newOnes = fromPantry.filter(fp => !selectedIngredients.find(si => si._id === fp._id));
    setSelectedIngredients([...selectedIngredients, ...newOnes]);
  };

  const getMatchClass = (percentage: number) => {
    if (percentage >= 80) return "match-high";
    if (percentage >= 50) return "match-medium";
    return "match-low";
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="suggester-page">
        <header className="suggester-header">
          <h1 className="suggester-title">Recipe Suggester</h1>
          <p className="suggester-sub">Select ingredients you have, and we'll tell you what you can cook!</p>
        </header>

        <div className="suggester-container">
          <aside className="selection-panel">
            <h3 className="panel-title"><Search size={20} /> Select Ingredients</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <IngredientSearchSelect 
                category="All"
                value={null}
                onChange={addIngredient}
              />
            </div>

            <button 
              className="pantry-btn ghost small full" 
              onClick={addAllFromPantry}
              style={{ marginBottom: '1.5rem', justifyContent: 'center' }}
            >
              <ChefHat size={16} /> Add all from Pantry
            </button>

            <div className="selected-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
               <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Selected ({selectedIngredients.length})</span>
               {selectedIngredients.length > 0 && (
                 <button 
                    onClick={() => setSelectedIngredients([])}
                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer' }}
                 >
                   Clear All
                 </button>
               )}
            </div>

            <div className="selected-list">
              {selectedIngredients.map(ing => (
                <div key={ing._id} className="ingredient-chip">
                  {ing.name}
                  <button className="remove-chip" onClick={() => removeIngredient(ing._id)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              {selectedIngredients.length === 0 && (
                <p style={{ color: '#475569', fontSize: '0.9rem', fontStyle: 'italic', width: '100%', textAlign: 'center', marginTop: '1rem' }}>
                  No ingredients selected yet.
                </p>
              )}
            </div>

            <button 
              className="suggest-btn" 
              onClick={handleSuggest} 
              disabled={loading || selectedIngredients.length === 0}
            >
              {loading ? <Loader2 className="spin" /> : <Sparkles size={20} />}
              {loading ? "Finding Recipes..." : "Suggest Recipes"}
            </button>
          </aside>

          <main className="results-panel">
            {suggestedRecipes.length > 0 ? (
              suggestedRecipes.map(recipe => (
                <div 
                  key={recipe._id} 
                  className="recipe-card-suggested"
                  onClick={() => navigate(`/recipes/${recipe._id}`)}
                >
                  <div className={`match-badge ${getMatchClass(recipe.matchPercentage || 0)}`}>
                    <CheckCircle2 size={16} />
                    {recipe.matchPercentage}% Match
                  </div>
                  
                  <img src={recipe.imageUrl || "https://via.placeholder.com/200x150?text=Recipe"} alt={recipe.name} className="recipe-img" />
                  
                  <div className="recipe-info">
                    <h2 className="recipe-name">{recipe.name}</h2>
                    <div className="recipe-meta">
                      <span><Clock size={14} /> {recipe.prepMinutes} min</span>
                      <span><Flame size={14} /> {recipe.calories} kcal</span>
                      <span className="matched-ingredients">{recipe.matchedCount} ingredients matched</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {recipe.description}
                    </p>
                    <div style={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                      View Details <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-results">
                {!loading && (
                  <>
                    <div className="empty-icon"><ChefHat size={64} /></div>
                    <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>Ready to Cook?</h3>
                    <p style={{ color: '#94a3b8' }}>
                      {selectedIngredients.length > 0 
                        ? "We couldn't find any recipes matching those ingredients. Try adding more or searching broader."
                        : "Select some ingredients on the left to see what you can make today!"}
                    </p>
                  </>
                )}
                {loading && (
                  <div style={{ padding: '2rem' }}>
                    <Loader2 className="spin" size={48} style={{ color: '#6366f1', marginBottom: '1rem' }} />
                    <p style={{ color: '#f8fafc' }}>Searching our cookbook...</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
