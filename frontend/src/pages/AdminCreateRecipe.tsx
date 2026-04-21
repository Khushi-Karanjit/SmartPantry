import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Sparkles,
    Search,
    Image as ImageIcon,
    Video as VideoIcon,
    Clock,
    Flame,
    Users,
    X,
    Info,
    Timer,
    Activity,
    Zap,
    Terminal,
    Layers,
    Database,
    Dna,
    ShieldAlert,
    Loader2,
    Beef,
    Wheat,
    Droplets,
    Minus
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import {
    createRecipeApi,
    updateRecipeApi,
    getRecipeApi,
    searchIngredientsApi,
    processVideoApi,
    PANTRY_UNITS
} from "../api/api";
import type { Ingredient } from "../api/api";

// Helper to clean messy ingredient names from transcripts
const cleanIngName = (name: string) => {
    return name
        .replace(/\(.*?\)/g, "") // Remove parentheses
        .replace(/^(about|around|roughly|some|a bit of|the|another|this|that|these|those|to|package on)\s+/i, "")
        .replace(/\s+(or|and|grams|ounces|ml|count|pcs|it|is|was|were|on this|of this|in the|of the|pasta).*$/i, "")
        .replace(/[^\w\s]/gi, '') // Remove punctuation
        .trim();
};

export default function AdminCreateRecipe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [autoLoading, setAutoLoading] = useState(false);
    const [magicShine, setMagicShine] = useState(false);
    const [error, setError] = useState("");
    const [prevServings, setPrevServings] = useState(2);

    const [recipe, setRecipe] = useState({
        name: "",
        description: "",
        cuisine: "",
        diet: "",
        prepMinutes: 30,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servings: 2,
        imageUrl: "",
        videoUrl: "",
        tags: [] as string[],
        ingredients: [] as { name: string; quantity: number; unit: string; ingredientId: string }[],
        steps: [] as { text: string; startTime: number }[],
        status: "published"
    });

    // Reactive Scaling Hook: Update stats and ingredients when servings change
    useEffect(() => {
        if (recipe.servings !== prevServings && prevServings > 0 && recipe.servings > 0) {
            const ratio = recipe.servings / prevServings;
            
            const scaledIngredients = recipe.ingredients.map(ing => ({
                ...ing,
                quantity: Math.round(ing.quantity * ratio * 100) / 100
            }));

            setRecipe(prev => ({
                ...prev,
                calories: Math.round(prev.calories * ratio),
                protein: Math.round(prev.protein * ratio * 10) / 10,
                carbs: Math.round(prev.carbs * ratio * 10) / 10,
                fat: Math.round(prev.fat * ratio * 10) / 10,
                ingredients: scaledIngredients
            }));
            
            setPrevServings(recipe.servings);
        }
    }, [recipe.servings, prevServings, recipe.ingredients]);

    // Real-time Macro-to-Calorie Calculation (4-4-9 Formula)
    useEffect(() => {
        const calculatedCalories = (recipe.protein * 4) + (recipe.carbs * 4) + (recipe.fat * 9);
        // Only update if it significantly differs to allow for minor rounding or intentional overrides
        if (Math.abs(calculatedCalories - recipe.calories) > 0.5) {
            setRecipe(prev => ({ 
                ...prev, 
                calories: Math.round(calculatedCalories * 10) / 10 
            }));
        }
    }, [recipe.protein, recipe.carbs, recipe.fat]);

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
                const dedupMap = new Map();
                (r.ingredients || []).forEach((ing: any) => {
                    const norm = ing.name.toLowerCase().trim();
                    if (dedupMap.has(norm)) {
                        const existing = dedupMap.get(norm);
                        existing.quantity += (ing.quantity || 1);
                    } else {
                        dedupMap.set(norm, { ...ing });
                    }
                });
                
                let cleanedIngredients = Array.from(dedupMap.values());
                cleanedIngredients.forEach((ing: any) => {
                    if (ing.name.toLowerCase().includes("sugar")) {
                        ing.unit = "g"; // Use strictly valid enum 'g'
                    }
                });

                setRecipe({
                    name: r.name || "",
                    description: r.description || "",
                    cuisine: r.cuisine || "",
                    diet: r.diet || "",
                    prepMinutes: r.prepMinutes || 30,
                    calories: r.calories || 0,
                    protein: r.protein || 0,
                    carbs: r.carbs || 0,
                    fat: r.fat || 0,
                    servings: r.servings || 2,
                    imageUrl: r.imageUrl || "",
                    videoUrl: r.videoUrl || "",
                    tags: r.tags || [],
                    ingredients: cleanedIngredients,
                    steps: r.steps || [],
                    status: r.status || "published"
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
                { name: ing.name, quantity: 1, unit: ing.defaultUnit || "pcs", ingredientId: ing._id }
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
        setRecipe({ ...recipe, steps: [...recipe.steps, { text: "", startTime: 0 }] });
    };

    const updateStep = (index: number, fields: any) => {
        const list = [...recipe.steps];
        list[index] = { ...list[index], ...fields };
        setRecipe({ ...recipe, steps: list });
    };

    const removeStep = (index: number) => {
        setRecipe({ ...recipe, steps: recipe.steps.filter((_, i) => i !== index) });
    };

    const handleAutoGenerateSteps = async () => {
        if (!recipe.videoUrl) {
            setError("Please provide a Video URL first");
            return;
        }
        
        try {
            setAutoLoading(true);
            setError("");
            const res = await processVideoApi(recipe.videoUrl);
            const sug = res.recipe;
            
            if (!sug) {
                setError("No recipe could be extracted from this video.");
                return;
            }

            // Trust the backend's sanitized ingredients and mapped IDs
            const mappedIngredients = (sug.ingredients || []).map((ing: any) => ({
                name: ing.name,
                quantity: ing.quantity || 1,
                unit: ing.unit || "pcs",
                ingredientId: ing.ingredientId || ""
            }));

            setRecipe(prev => ({
                ...prev,
                cuisine: sug.cuisine || prev.cuisine,
                diet: sug.diet || prev.diet,
                prepMinutes: sug.prepMinutes || prev.prepMinutes,
                calories: sug.calories || 0,
                protein: sug.protein || 0,
                carbs: sug.carbs || 0,
                fat: sug.fat || 0,
                servings: sug.servings || 2,
                ingredients: mappedIngredients,
                steps: sug.steps && sug.steps.length > 0 ? sug.steps : prev.steps
            }));

            setMagicShine(true);
            setTimeout(() => setMagicShine(false), 2000);

        } catch (err: any) {
            setError(err.message || "Failed to auto-generate recipe. Check if video has transcripts.");
        } finally {
            setAutoLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipe.name) return setError("Recipe name is required");
        if (recipe.ingredients.length === 0) return setError("At least one ingredient is required");
        
        // Final Safety Check: Ensure NO empty ingredient IDs reach the backend
        const missingIds = recipe.ingredients.filter(i => !i.ingredientId);
        if (missingIds.length > 0) {
            return setError(`Ingredient selection required for: ${missingIds.map(i => i.name).join(', ')}. Please search and select from the database.`);
        }

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

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    if (fetching) {
        return (
            <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
                <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 text-blue-600">
                    <Activity className="animate-pulse" size={64} />
                    <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading Recipe Details...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-32">
                
                {/* HEADER SECTION */}
                <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <button 
                                type="button" 
                                onClick={() => navigate("/admin")} 
                                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{id ? "Edit" : "Create"} <span className="text-blue-600">Recipe</span></h1>
                        </div>

                        
                        <div className="flex items-center gap-4 mt-4 ml-14">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipe Visibility</label>
                            <div className="flex items-center gap-2">
                                {["published", "draft", "archived"].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRecipe({ ...recipe, status: s })}
                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            recipe.status === s
                                                ? (s === "published" ? "bg-green-50 text-green-600 border-green-200 ring-4 ring-green-50" : 
                                                   s === "draft" ? "bg-yellow-50 text-yellow-600 border-yellow-200 ring-4 ring-yellow-50" :
                                                   "bg-slate-100 text-slate-600 border-slate-300 ring-4 ring-slate-50")
                                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {error && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
                        <ShieldAlert size={18} /> {error}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* LEFT ZONE: IDENTITY & SPECS */}
                    <div className="xl:col-span-5 space-y-8">
                        <motion.section variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl overflow-hidden shadow-md group">
                           <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                              <Info size={20} className="text-blue-600" />
                              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">General Info</h3>
                           </div>
                           
                           <div className="p-6 space-y-6">
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 group/img">
                                    {recipe.imageUrl ? (
                                        <>
                                            <img 
                                                src={recipe.imageUrl} 
                                                alt="Preview" 
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL'; }} 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-6">
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/40 text-xs font-bold text-white backdrop-blur-md">
                                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                    Preview Active
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                            <ImageIcon size={48} strokeWidth={1} />
                                            <p className="text-xs font-bold uppercase tracking-widest">No Image Provided</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Recipe Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                            placeholder="Enter recipe name..."
                                            value={recipe.name}
                                            onChange={e => setRecipe({ ...recipe, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Image URL</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                            placeholder="https://..."
                                            value={recipe.imageUrl}
                                            onChange={e => setRecipe({ ...recipe, imageUrl: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Video Source (YouTube)</label>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="relative group flex-1">
                                                <VideoIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                                    placeholder="https://youtu.be/..."
                                                    value={recipe.videoUrl}
                                                    onChange={e => setRecipe({ ...recipe, videoUrl: e.target.value })}
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                className={`bg-yellow-50 text-yellow-600 border border-yellow-200 py-3 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 group hover:bg-yellow-100 transition-all shrink-0 ${autoLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                                onClick={handleAutoGenerateSteps}
                                            >
                                                {autoLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />}
                                                {autoLoading ? "Syncing..." : "Auto-Generate"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
                                        <textarea
                                            className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all h-28 resize-none"
                                            placeholder="Enter recipe description..."
                                            value={recipe.description}
                                            onChange={e => setRecipe({ ...recipe, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                           </div>
                        </motion.section>

                        <motion.section variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl overflow-hidden shadow-md">
                           <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                              <Sparkles size={20} className="text-yellow-500" />
                              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Details & Tags</h3>
                           </div>
                           
                           <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cuisine Type</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all capitalize"
                                            placeholder="Italian, Mexican..."
                                            value={recipe.cuisine}
                                            onChange={e => setRecipe({ ...recipe, cuisine: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Diet Protocol</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all capitalize"
                                            placeholder="Vegan, Keto..."
                                            value={recipe.diet}
                                            onChange={e => setRecipe({ ...recipe, diet: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { l: "Prep Time", v: recipe.prepMinutes, i: <Clock size={16} />, k: "prepMinutes", s: "MIN" },
                                        { l: "Calories", v: recipe.calories, i: <Flame size={16} />, k: "calories", s: "KCAL" },
                                        { l: "Servings", v: recipe.servings, i: <Users size={16} />, k: "servings", s: "SRV" }
                                    ].map(spec => (
                                        <div key={spec.l} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                {spec.i}
                                                <span className="text-xs font-bold uppercase tracking-widest">{spec.l}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {spec.k === "servings" && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setRecipe({ ...recipe, servings: Math.max(1, recipe.servings - 1) })}
                                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm shrink-0"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                )}
                                                <input
                                                    type="number"
                                                    className={`w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none ${spec.k === 'servings' ? 'text-center' : ''}`}
                                                    value={spec.v}
                                                    onChange={e => setRecipe({ ...recipe, [spec.k]: Number(e.target.value) })}
                                                />
                                                {spec.k === "servings" && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setRecipe({ ...recipe, servings: recipe.servings + 1 })}
                                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm shrink-0"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                )}
                                                <span className="text-xs font-bold text-slate-400">{spec.s}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { l: "Protein", v: recipe.protein, i: <Beef size={16} />, k: "protein", s: "G" },
                                        { l: "Carbs", v: recipe.carbs, i: <Wheat size={16} />, k: "carbs", s: "G" },
                                        { l: "Fat", v: recipe.fat, i: <Droplets size={16} />, k: "fat", s: "G" }
                                    ].map(spec => (
                                        <div key={spec.l} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                {spec.i}
                                                <span className="text-xs font-bold uppercase tracking-widest">{spec.l}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none"
                                                    value={spec.v}
                                                    onChange={e => setRecipe({ ...recipe, [spec.k]: Number(e.target.value) })}
                                                />
                                                <span className="text-xs font-bold text-slate-400">{spec.s}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tags (Press Enter)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                        placeholder="Add tag..."
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={addTag}
                                    />
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <AnimatePresence>
                                            {recipe.tags.map(tag => (
                                                <motion.span 
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.8, opacity: 0 }}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-2 group hover:bg-blue-100 transition-colors" 
                                                    key={tag}
                                                >
                                                    <span className="text-xs font-bold text-blue-700">#{tag}</span>
                                                    <button type="button" onClick={() => removeTag(tag)} className="text-blue-400 hover:text-red-500 transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </motion.span>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                           </div>
                        </motion.section>
                    </div>

                    {/* RIGHT ZONE: STRUCTURE */}
                    <div className="xl:col-span-7 space-y-8">
                        <motion.section variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl overflow-hidden shadow-md">
                           <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Layers size={24} className="text-blue-600" />
                                    <h3 className="text-lg font-bold text-slate-900">Ingredients</h3>
                                </div>
                                <div className="relative w-72">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                        type="text"
                                        placeholder="Search elements..."
                                        value={ingredientSearch}
                                        onChange={(e) => setIngredientSearch(e.target.value)}
                                    />
                                    <AnimatePresence>
                                        {searchResults.length > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute left-0 right-0 top-full mt-2 bg-[#FAFDFF] border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden overflow-y-auto max-h-64"
                                            >
                                                {searchResults.map(ing => (
                                                    <button type="button" className="w-full flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 group transition-colors" key={ing._id} onClick={() => addIngredient(ing)}>
                                                        <div className="text-left space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{ing.name}</p>
                                                            <p className="text-xs text-slate-500 capitalize">{ing.category}</p>
                                                        </div>
                                                        <Plus size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                           </div>

                            <div className="p-6 space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {recipe.ingredients.map((ing, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="p-5 rounded-2xl bg-[#FAFDFF] border border-slate-200 hover:shadow-md transition-shadow group" 
                                            key={idx}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <Database size={18} />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 capitalize">{cleanIngName(ing.name)}</p>
                                                </div>
                                                <button type="button" className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100" onClick={() => removeIngredient(idx)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="col-span-1 space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-500 ml-1">QTY</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-400"
                                                        value={ing.quantity}
                                                        onChange={e => updateIngredient(idx, { quantity: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="col-span-1 space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-500 ml-1">UNIT</label>
                                                    <select
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer"
                                                        value={ing.unit}
                                                        onChange={e => updateIngredient(idx, { unit: e.target.value })}
                                                    >
                                                        {PANTRY_UNITS.map(u => (
                                                            <option key={u} value={u}>{u}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {recipe.ingredients.length === 0 && (
                                    <div className="p-12 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-400 mx-auto border border-slate-200">
                                            <Layers size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500">No ingredients added yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        <motion.section variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl overflow-hidden shadow-md">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Timer size={24} className="text-green-600" />
                                    <h3 className="text-lg font-bold text-slate-900">Instructions</h3>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {recipe.steps.map((step, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`p-5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4 group/step transition-all ${magicShine ? 'animate-pulse ring-2 ring-yellow-400' : ''}`} 
                                            key={idx}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[#FAFDFF] border border-slate-200 flex items-center justify-center text-lg font-bold text-blue-600 shrink-0 shadow-md">
                                                {String(idx + 1)}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <textarea
                                                    className="w-full bg-transparent border-none text-slate-900 text-sm font-medium focus:outline-none resize-none min-h-[60px]"
                                                    placeholder="Enter instruction step..."
                                                    value={step.text}
                                                    onChange={e => updateStep(idx, { text: e.target.value })}
                                                />
                                                <div className="flex items-center gap-6 pt-3 border-t border-slate-200/50">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={16} className="text-slate-400" />
                                                        <label className="text-xs font-bold text-slate-500 ml-1">Start Time (sec)</label>
                                                        <input
                                                            type="number"
                                                            className="w-20 bg-[#FAFDFF] border border-slate-200 rounded-lg px-2 py-1 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-400"
                                                            value={step.startTime}
                                                            onChange={e => updateStep(idx, { startTime: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div className="flex-1" />
                                                    <button type="button" className="text-slate-400 hover:text-red-500 transition-colors p-2" onClick={() => removeStep(idx)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button type="button" className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2" onClick={addStep}>
                                    <Plus size={18} /> Add Step
                                </button>
                            </div>
                        </motion.section>
                    </div>
                </div>

                {/* FINAL ACTION BAR */}
                <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-0 left-0 lg:left-72 right-0 z-50 p-4 sm:p-6 lg:px-12"
                >
                    <div className="max-w-[1600px] mx-auto bg-[#FAFDFF]/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-4 sm:p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-center sm:justify-start hidden md:flex">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <Terminal size={24} />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase">Saving Changes</h4>
                                <p className="text-[10px] sm:text-xs text-slate-500">Ensure all details are correct before saving</p>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
                            <button type="button" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all text-center flex justify-center" onClick={() => navigate("/admin")}>
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="w-full sm:w-auto bg-blue-600 text-white rounded-2xl py-3 sm:py-4 px-6 sm:px-10 text-xs sm:text-sm font-bold uppercase tracking-widest shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (id ? <Save size={20} /> : <Zap size={20} className="hover:animate-pulse" />)}
                                {loading ? "Saving..." : (id ? "Update" : "Create")}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}
