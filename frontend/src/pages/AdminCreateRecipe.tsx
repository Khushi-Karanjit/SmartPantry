import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Sparkles,
    Search
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
    createRecipeApi,
    updateRecipeApi,
    getRecipeApi,
    searchIngredientsApi
} from "../api/api";
import type { Ingredient } from "../api/api";
import "../styles/admin.css";

export default function AdminCreateRecipe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");

    const [recipe, setRecipe] = useState({
        name: "",
        description: "",
        cuisine: "",
        diet: "",
        prepMinutes: 30,
        calories: 0,
        servings: 2,
        imageUrl: "",
        tags: [] as string[],
        ingredients: [] as { name: string; quantity: number; unit: string; ingredientId: string }[],
        steps: [] as string[],
        status: "published"
    });

    const [tagInput, setTagInput] = useState("");
    const [ingredientSearch, setIngredientSearch] = useState("");
    const [searchResults, setSearchResults] = useState<Ingredient[]>([]);

    useEffect(() => {
        if (id) {
            loadRecipe(id);
        }
    }, [id]);

    const loadRecipe = async (recipeId: string) => {
        try {
            setFetching(true);
            const res = await getRecipeApi(recipeId);
            const r = res.recipe;
            setRecipe({
                name: r.name,
                description: r.description,
                cuisine: r.cuisine,
                diet: r.diet,
                prepMinutes: r.prepMinutes,
                calories: r.calories,
                servings: r.servings,
                imageUrl: r.imageUrl,
                tags: r.tags,
                ingredients: r.ingredients,
                steps: r.steps,
                status: r.status
            });
        } catch (err: any) {
            setError("Failed to load recipe details");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (ingredientSearch.length > 1) {
            const delay = setTimeout(async () => {
                try {
                    const res = await searchIngredientsApi({ q: ingredientSearch });
                    setSearchResults(res.ingredients);
                } catch (err) {
                    console.error("Failed to search ingredients", err);
                }
            }, 300);
            return () => clearTimeout(delay);
        } else {
            setSearchResults([]);
        }
    }, [ingredientSearch]);

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!recipe.tags.includes(tagInput.trim())) {
                setRecipe({ ...recipe, tags: [...recipe.tags, tagInput.trim()] });
            }
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        setRecipe({ ...recipe, tags: recipe.tags.filter(t => t !== tag) });
    };

    const addIngredient = (ing: Ingredient) => {
        setRecipe({
            ...recipe,
            ingredients: [
                ...recipe.ingredients,
                { name: ing.name, quantity: 1, unit: ing.defaultUnit || "", ingredientId: ing._id }
            ]
        });
        setIngredientSearch("");
        setSearchResults([]);
    };

    const updateIngredient = (index: number, fields: any) => {
        const list = [...recipe.ingredients];
        list[index] = { ...list[index], ...fields };
        setRecipe({ ...recipe, ingredients: list });
    };

    const removeIngredient = (index: number) => {
        setRecipe({ ...recipe, ingredients: recipe.ingredients.filter((_, i) => i !== index) });
    };

    const addStep = () => {
        setRecipe({ ...recipe, steps: [...recipe.steps, ""] });
    };

    const updateStep = (index: number, value: string) => {
        const list = [...recipe.steps];
        list[index] = value;
        setRecipe({ ...recipe, steps: list });
    };

    const removeStep = (index: number) => {
        setRecipe({ ...recipe, steps: recipe.steps.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipe.name) return setError("Recipe name is required");
        if (recipe.ingredients.length === 0) return setError("At least one ingredient is required");
        if (recipe.steps.length === 0) return setError("At least one step is required");

        try {
            setLoading(true);
            setError("");
            if (id) {
                await updateRecipeApi(id, recipe);
            } else {
                await createRecipeApi(recipe);
            }
            navigate("/admin");
        } catch (err: any) {
            setError(err.message || "Failed to save recipe");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <DashboardLayout topbar={() => (
                <div className="topbar">
                    <div className="topbar-left">
                        <button className="icon-btn" onClick={() => navigate("/admin")}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1>Loading Recipe...</h1>
                    </div>
                </div>
            )}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p className="muted">Fetching recipe details...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout topbar={() => (
            <div className="topbar">
                <div className="topbar-left">
                    <button className="icon-btn" onClick={() => navigate("/admin")}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1>{id ? "Edit Recipe" : "Add New Recipe"}</h1>
                </div>
            </div>
        )}>
            <form className="admin-recipe-form" onSubmit={handleSubmit}>
                {error && <div className="admin-error-banner">{error}</div>}

                <div className="admin-form-grid">
                    <section className="card form-section main-info">
                        <h3><Sparkles size={18} /> Basic Information</h3>
                        <div className="form-group">
                            <label>Recipe Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Garlic Butter Chicken"
                                value={recipe.name}
                                onChange={e => setRecipe({ ...recipe, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                placeholder="Briefly describe this recipe..."
                                value={recipe.description}
                                onChange={e => setRecipe({ ...recipe, description: e.target.value })}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Cuisine</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Italian"
                                    value={recipe.cuisine}
                                    onChange={e => setRecipe({ ...recipe, cuisine: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Diet</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Vegetarian"
                                    value={recipe.diet}
                                    onChange={e => setRecipe({ ...recipe, diet: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-row-3">
                            <div className="form-group">
                                <label>Prep (min)</label>
                                <input
                                    type="number"
                                    value={recipe.prepMinutes}
                                    onChange={e => setRecipe({ ...recipe, prepMinutes: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Calories</label>
                                <input
                                    type="number"
                                    value={recipe.calories}
                                    onChange={e => setRecipe({ ...recipe, calories: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Servings</label>
                                <input
                                    type="number"
                                    value={recipe.servings}
                                    onChange={e => setRecipe({ ...recipe, servings: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Image URL</label>
                            <input
                                type="text"
                                placeholder="https://..."
                                value={recipe.imageUrl}
                                onChange={e => setRecipe({ ...recipe, imageUrl: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tags (press Enter)</label>
                            <input
                                type="text"
                                placeholder="e.g. easy, quick"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={addTag}
                            />
                            <div className="pill-list" style={{ marginTop: '0.5rem' }}>
                                {recipe.tags.map(tag => (
                                    <span className="pill-chip" key={tag}>
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)}><Trash2 size={10} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div className="form-side">
                        <section className="card form-section">
                            <h3><Plus size={18} /> Ingredients</h3>
                            <div className="search-wrap">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search database..."
                                    value={ingredientSearch}
                                    onChange={(e) => setIngredientSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="search-dropdown">
                                        {searchResults.map(ing => (
                                            <div className="search-item" key={ing._id} onClick={() => addIngredient(ing)}>
                                                {ing.name} <small>{ing.category}</small>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="ingredient-list">
                                {recipe.ingredients.map((ing, idx) => (
                                    <div className="ingredient-row" key={idx}>
                                        <div className="ing-name">{ing.name}</div>
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={ing.quantity}
                                            onChange={e => updateIngredient(idx, { quantity: Number(e.target.value) })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Unit"
                                            value={ing.unit}
                                            onChange={e => updateIngredient(idx, { unit: e.target.value })}
                                        />
                                        <button type="button" onClick={() => removeIngredient(idx)}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                {recipe.ingredients.length === 0 && <p className="muted">No ingredients added.</p>}
                            </div>
                        </section>

                        <section className="card form-section">
                            <h3><Plus size={18} /> Instructions</h3>
                            <div className="steps-list">
                                {recipe.steps.map((step, idx) => (
                                    <div className="step-row" key={idx}>
                                        <span>{idx + 1}</span>
                                        <textarea
                                            placeholder="Type step..."
                                            value={step}
                                            onChange={e => updateStep(idx, e.target.value)}
                                        />
                                        <button type="button" onClick={() => removeStep(idx)}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button type="button" className="admin-btn ghost small full" onClick={addStep}>
                                    <Plus size={14} /> Add Step
                                </button>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="admin-btn ghost" onClick={() => navigate("/admin")}>Cancel</button>
                    <button type="submit" className="admin-btn primary" disabled={loading}>
                        <Save size={18} /> {loading ? "Saving..." : (id ? "Update Recipe" : "Create & Publish")}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
