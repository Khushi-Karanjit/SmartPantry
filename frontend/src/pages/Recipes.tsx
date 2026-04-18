import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import PageSkeleton from "../components/PageSkeleton";
import { getPantryItemsApi, listRecipesApi, listCuisinesApi, toggleSaveRecipeApi, type PantryItem, type Recipe, type PaginationMeta } from "../api/api";
import { 
  Search, 
  ChevronDown, 
  Flame, 
  Clock, 
  Layers, 
  ChefHat, 
  ArrowRight, 
  X, 
  Plus, 
  Minus,
  Sparkles,
  Sunrise,
  Sun,
  Moon,
  Apple,
  Heart
} from "lucide-react";

type RecipeMatch = Recipe & { match: number };

function buildPantrySet(items: PantryItem[]) {
  const set = new Set<string>();
  items.forEach((item) => {
    if (item.ingredientId) {
      const id = typeof item.ingredientId === 'object' 
        ? (item.ingredientId as any)._id 
        : item.ingredientId;
      set.add(String(id));
    }
  });
  return set;
}

function computeMatch(recipe: Recipe, pantrySet: Set<string>) {
  const ingredients = recipe.ingredients || [];
  if (!ingredients.length) return 0;
  const matched = ingredients.filter((ing) => pantrySet.has(String(ing.ingredientId))).length;
  return Math.round((matched / ingredients.length) * 100);
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [hasVideo, setHasVideo] = useState("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [servings, setServings] = useState(2);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [pantryRes, cuisinesRes] = await Promise.all([
          getPantryItemsApi(),
          listCuisinesApi(),
        ]);
        setPantry(pantryRes.items || []);
        setCuisines(cuisinesRes.cuisines || []);
      } catch (e: any) {
        console.error("Data sync error", e);
      }
    })();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await listRecipesApi({
          page,
          limit: 12,
          search,
          cuisine: selectedCuisine,
          hasVideo
        });
        if (!active) return;
        setRecipes(res.recipes || []);
        setPagination(res.pagination);
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load recipes. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [page, search, selectedCuisine, hasVideo]);

  useEffect(() => {
    setPage(1);
    setPreviewId(null);
  }, [search, selectedCuisine, hasVideo]);

  const matches = useMemo<RecipeMatch[]>(() => {
    return recipes.map((recipe) => ({
      ...recipe,
      match: recipe.matchPercentage || 0,
    }));
  }, [recipes]);

  const previewRecipe = useMemo(
    () => matches.find((recipe) => recipe._id === previewId) || null,
    [matches, previewId]
  );

  useEffect(() => {
    if (previewRecipe) setServings(previewRecipe.servings || 2);
  }, [previewRecipe?._id]);

  function adjustServings(delta: number) {
    if (!previewRecipe) return;
    const base = previewRecipe.servings || 2;
    const next = Math.max(1, servings + delta);
    const limit = Math.max(base * 3, 8);
    setServings(Math.min(limit, next));
  }

  const handleToggleSave = async (recipe: Recipe) => {
    try {
      const res = await toggleSaveRecipeApi(recipe._id);
      // Optimistically update local state
      setRecipes(prev => prev.map(r => 
        r._id === recipe._id ? { ...r, isSaved: res.saved } : r
      ));
    } catch (err) {
      console.error("Toggle save error", err);
    }
  };

  function scaledQuantity(qty: number) {
    if (!previewRecipe || !qty) return qty;
    const base = previewRecipe.servings || 2;
    return Math.round((qty * servings * 100) / base) / 100;
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="space-y-8 pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Recommended <span className="text-blue-600">Recipes</span></h2>
            <p className="text-slate-500 text-sm">Find something delicious to cook with what you have.</p>
          </div>
          
          <div className="flex gap-4">
             <Link to="/recipe-suggester" className="btn-futuristic flex items-center gap-2 group shadow-lg">
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                <span>Get Ideas</span>
             </Link>
          </div>
        </div>

        {/* FILTER ARRAY */}
        <div className="bg-white p-4 flex flex-col lg:flex-row items-center gap-4 border border-slate-200 rounded-2xl shadow-md">
          <div className="flex-1 relative group w-full">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ingredients, titles..."
              className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl py-4 pl-14 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-48 group">
                <select
                  value={hasVideo}
                  onChange={(e) => setHasVideo(e.target.value)}
                  className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl py-4 pl-6 pr-10 text-sm text-slate-900 appearance-none focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer font-bold"
                >
                  <option value="all" className="bg-white">All Media</option>
                  <option value="with" className="bg-white">With Videos</option>
                  <option value="without" className="bg-white">Photos Only</option>
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-900 transition-colors" />
             </div>
              <div className="relative flex-1 lg:w-48 group">
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl py-4 pl-6 pr-10 text-sm text-slate-900 appearance-none focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer font-bold"
                >
                  <option value="" className="bg-white">All Cuisines</option>
                  {cuisines.map((c) => (
                    <option key={c} value={c} className="bg-white">{c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-900 transition-colors" />
             </div>
          </div>
        </div>

        {error && <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest text-center">{error}</div>}

        {loading ? (
          <PageSkeleton cards={8} />
        ) : (
          <>
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 px-1">
              {matches.length === 0 && (
                <div className="col-span-full py-20 bg-slate-50 border border-slate-200 rounded-3xl text-center text-slate-400">
                   <p className="font-bold uppercase tracking-widest text-sm">No recipes found matching your search.</p>
                </div>
              )}
              
              {matches.map((recipe) => (
                <motion.div 
                  key={recipe._id} 
                  variants={item}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl overflow-hidden cursor-pointer group border border-slate-200 hover:border-blue-200 shadow-md hover:shadow-md transition-all" 
                  onClick={() => setPreviewId(recipe._id)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={recipe.imageUrl || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <div className="px-3 py-1 bg-white/90 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md backdrop-blur-sm">
                        {recipe.match}% Matches
                        </div>
                        <button 
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${recipe.isSaved ? 'bg-pink-500 text-white' : 'bg-white/90 text-slate-400 hover:text-pink-500'}`}
                            onClick={(e) => { e.stopPropagation(); handleToggleSave(recipe); }}
                        >
                            <Heart size={18} fill={recipe.isSaved ? "currentColor" : "none"} />
                        </button>
                    </div>

                    {recipe.mealType && (
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1.5 glass bg-black/40 text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/10 flex items-center gap-1.5">
                          {recipe.mealType.toLowerCase() === "breakfast" ? <Sunrise size={12} /> : 
                           recipe.mealType.toLowerCase() === "lunch" ? <Sun size={12} /> : 
                           recipe.mealType.toLowerCase() === "dinner" ? <Moon size={12} /> : <Apple size={12} />} {recipe.mealType}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">{recipe.name}</h3>
                            <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-400">
                         <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                            <Clock size={12} className="text-blue-500" />
                            <span>{recipe.prepMinutes || 20}m</span>
                         </div>
                         <div className="w-1 h-1 rounded-full bg-slate-200" />
                         <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                            <ChefHat size={12} className="text-blue-500" />
                            <span>{recipe.cuisine || "Global"}</span>
                         </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[9px] font-bold uppercase tracking-widest">{recipe.diet || "Balanced"}</span>
                      {recipe.calories && <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1"><Flame size={10} /> {recipe.calories} kcal</span>}
                    </div>
      </div>
                </motion.div>
              ))}
            </motion.div>

            {/* SECTOR PAGING */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12 py-6 border-t border-white/5">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1} 
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FAFDFF] border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-20 transition-all shadow-md"
                  >
                    ←
                  </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-12 h-12 rounded-xl text-xs font-bold transition-all border
                        ${page === i + 1 
                          ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} 
                  disabled={page === pagination.totalPages} 
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FAFDFF] border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-20 transition-all shadow-md"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}

        {/* QUICK VIEW HUB (SIDEBAR DRAWER) */}
        <AnimatePresence>
          {previewId && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm" 
                onClick={() => setPreviewId(null)} 
              />
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 z-[160] w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl overflow-y-auto custom-scrollbar"
              >
                {previewRecipe && (
                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><ChefHat size={20}/></div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipe Details</p>
                             <p className="text-slate-800 font-bold text-sm uppercase">Detailed Overview</p>
                          </div>
                       </div>
                       <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors" onClick={() => setPreviewId(null)}><X size={20}/></button>
                    </div>

                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
                      <img src={previewRecipe.imageUrl || ""} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">{previewRecipe.match}% Match</span>
                            <button 
                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${previewRecipe.isSaved ? 'bg-pink-500 text-white' : 'bg-white/90 text-slate-400 hover:text-pink-500'}`}
                                onClick={() => handleToggleSave(previewRecipe)}
                            >
                                <Heart size={18} fill={previewRecipe.isSaved ? "currentColor" : "none"} />
                            </button>
                         </div>
                         <span className="text-xs font-bold text-white px-3 py-1 bg-black/20 rounded-lg">{previewRecipe.cuisine}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{previewRecipe.name}</h2>
                      <div className="flex gap-3">
                        <span className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-widest">{previewRecipe.mealType}</span>
                        <span className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Verified</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                       {[
                         { label: "Prep", value: `${previewRecipe.prepMinutes} MIN`, icon: <Clock size={14}/> },
                         { label: "Calories", value: `${Math.round(previewRecipe.calories * (servings / (previewRecipe.servings || 2)) || 0)} kcal`, icon: <Flame size={14} className="text-orange-500" /> },
                         { label: "Protein", value: `${Math.round(previewRecipe.protein * (servings / (previewRecipe.servings || 2)) || 0)}g`, icon: <div className="font-bold text-[10px]">P</div> },
                         { label: "Carbs", value: `${Math.round(previewRecipe.carbs * (servings / (previewRecipe.servings || 2)) || 0)}g`, icon: <div className="font-bold text-[10px]">C</div> },
                         { label: "Fat", value: `${Math.round(previewRecipe.fat * (servings / (previewRecipe.servings || 2)) || 0)}g`, icon: <div className="font-bold text-[10px]">F</div> },
                         { label: "Servings", value: `${servings}`, icon: <Layers size={14}/> }
                       ].map((s, i) => (
                         <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-2 text-center p-3">
                            <div className="text-slate-500 mb-0.5">{s.icon}</div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                            <span className="text-xs font-bold text-slate-800">{s.value}</span>
                         </div>
                       ))}
                    </div>

                    <div className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-md">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Ingredients needed</h4>
                          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
                             <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white hover:bg-slate-50 transition-colors shadow-md" onClick={() => adjustServings(-1)}><Minus size={14} /></button>
                             <span className="text-xs font-bold w-4 text-center text-slate-800">{servings}</span>
                             <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white hover:bg-slate-50 transition-colors shadow-md" onClick={() => adjustServings(1)}><Plus size={14} /></button>
                          </div>
                       </div>
                       <ul className="space-y-4">
                         {(previewRecipe.ingredients || []).map((ing, idx) => (
                           <li key={idx} className="flex items-center justify-between group">
                             <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-200 group-hover:bg-blue-500 transition-colors" />
                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{ing.name}</span>
                             </div>
                             <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors tracking-widest">{scaledQuantity(ing.quantity)} {ing.unit}</span>
                           </li>
                         ))}
                       </ul>
                    </div>

                    <div className="flex gap-4 pt-4 pb-12">
                      <Link className="flex-1 btn-futuristic py-4 text-center text-sm shadow-blue-100 flex items-center justify-center gap-2" to={`/recipes/${previewRecipe._id}`}>
                        Start Cooking <ArrowRight size={16} />
                      </Link>
                      <button 
                        className={`flex-1 py-4 text-center text-sm font-bold rounded-2xl border transition-all ${previewRecipe.isSaved ? 'bg-pink-50 border-pink-100 text-pink-600' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`} 
                        onClick={() => handleToggleSave(previewRecipe)}
                      >
                        {previewRecipe.isSaved ? "Favourited" : "Add to Favourites"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
