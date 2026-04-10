import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Zap
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import IngredientSearchSelect from "../components/IngredientSearchSelect";
import { suggestRecipesApi, getPantryItemsApi } from "../api/api";
import type { Recipe, Ingredient, PantryItem } from "../api/api";

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
      
      if (items.length === 0) {
        setSelectedIngredients([]);
        setSuggestedRecipes([]);
        return;
      }

      const fromPantry: Ingredient[] = items.map(item => {
        const ingData = (item.ingredientId && typeof item.ingredientId === 'object') 
          ? item.ingredientId 
          : { _id: item.ingredientId, name: item.name, category: item.category, defaultUnit: item.unit };

        return {
          _id: (ingData as any)._id || String(ingData),
          name: (ingData as any).name || item.name,
          category: (ingData as any).category || item.category,
          defaultUnit: (ingData as any).defaultUnit || item.unit,
          shelfLifeDays: (ingData as any).shelfLifeDays || 0,
          isCustom: false
        };
      });
      setSelectedIngredients(fromPantry);
      
      const ids = fromPantry.map(i => i._id);
      const suggRes = await suggestRecipesApi(ids);
      setSuggestedRecipes(suggRes.recipes || []);
    } catch (err) {
      console.error("Pantry sync error", err);
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
      console.error("Recipe search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const addAllFromPantry = () => {
    const fromPantry: Ingredient[] = pantryItems.map(item => {
      const ingData = (item.ingredientId && typeof item.ingredientId === 'object') 
        ? item.ingredientId 
        : { _id: item.ingredientId, name: item.name, category: item.category, defaultUnit: item.unit };

      return {
        _id: (ingData as any)._id || String(ingData),
        name: (ingData as any).name || item.name,
        category: (ingData as any).category || item.category,
        defaultUnit: (ingData as any).defaultUnit || item.unit,
        shelfLifeDays: (ingData as any).shelfLifeDays || 0,
        isCustom: false
      };
    });
    
    const newOnes = fromPantry.filter(fp => !selectedIngredients.find(si => si._id === fp._id));
    setSelectedIngredients([...selectedIngredients, ...newOnes]);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="space-y-8 pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Recipe <span className="text-blue-600">Matcher</span></h2>
            <p className="text-slate-500 text-sm">Find the perfect meal based on ingredients you already have.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SELECTION TERMINAL */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#FAFDFF] border border-slate-200 rounded-3xl space-y-8 p-8 shadow-md">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Search size={20} /></div>
                 <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Ingredients</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Add Ingredients</p>
                <IngredientSearchSelect 
                  category="All"
                  value={null}
                  onChange={addIngredient}
                />
                
                <button 
                  onClick={addAllFromPantry}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all group"
                >
                  <ChefHat size={16} className="group-hover:rotate-12 transition-transform" /> Add All from Pantry
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected ({selectedIngredients.length})</p>
                   {selectedIngredients.length > 0 && (
                     <button 
                        onClick={() => setSelectedIngredients([])}
                        className="text-[10px] font-black text-red-500/60 uppercase tracking-widest hover:text-red-500 transition-colors"
                     >
                       Clear All
                     </button>
                   )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {selectedIngredients.map(ing => (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        key={ing._id} 
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all shadow-md"
                      >
                        {ing.name}
                        <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => removeIngredient(ing._id)}>
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {selectedIngredients.length === 0 && (
                    <div className="w-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs font-medium text-slate-400">No ingredients selected.</p>
                    </div>
                  )}
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSuggest} 
                disabled={loading || selectedIngredients.length === 0}
                className="w-full btn-futuristic py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest shadow-blue-200"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                {loading ? "Searching..." : "Get Suggestions"}
              </motion.button>
            </div>
          </aside>

          {/* SYNTHESIS RESULTS */}
          <main className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#FAFDFF] border border-slate-200 rounded-3xl h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 shadow-md"
                >
                   <div className="relative">
                      <div className="absolute inset-0 bg-blue-100 blur-3xl rounded-full scale-150 animate-pulse" />
                      <Loader2 className="animate-spin text-blue-600 relative z-10" size={64} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold uppercase tracking-widest text-slate-900">Finding Recipes</h3>
                      <p className="text-slate-500 font-medium">Looking for the best matches in our database...</p>
                   </div>
                </motion.div>
              ) : suggestedRecipes.length > 0 ? (
                <motion.div 
                  key="results"
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {suggestedRecipes.map(recipe => (
                    <motion.div 
                      key={recipe._id} 
                      variants={item}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-3xl overflow-hidden cursor-pointer group border border-slate-200 hover:border-blue-200 transition-all shadow-md hover:shadow-md"
                      onClick={() => navigate(`/recipes/${recipe._id}`)}
                    >
                      <div className="relative aspect-[16/10]">
                        <img src={recipe.imageUrl || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        
                        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 shadow-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5
                          ${(recipe.matchPercentage || 0) >= 80 ? "text-emerald-600" : 
                            (recipe.matchPercentage || 0) >= 50 ? "text-amber-600" : "text-blue-600"}
                        `}>
                          <CheckCircle2 size={12} />
                          {recipe.matchPercentage}% match
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors uppercase">{recipe.name}</h2>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest"><Clock size={12} className="text-blue-500"/> {recipe.prepMinutes} min</span>
                          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest"><Flame size={12} className="text-blue-500"/> {recipe.calories} kcal</span>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>Match score</span>
                              <span className="text-blue-600">{recipe.matchedCount} ingredients</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${recipe.matchPercentage}%` }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-400" />
                           </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{recipe.description}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                          View Recipe <ArrowRight size={14} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#FAFDFF] border border-slate-200 border-dashed rounded-3xl h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 shadow-md"
                >
                   <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-200 mb-8">
                      <ChefHat size={48} />
                   </div>
                   <div className="max-w-md space-y-4">
                      <h3 className="text-2xl font-bold uppercase tracking-widest text-slate-800">No matches found</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        {selectedIngredients.length > 0 
                          ? "We couldn't find any recipes that match your current ingredients. Try adding more items or changing your selection."
                          : "Add some ingredients to your list to get recipe suggestions."}
                      </p>
                      <div className="pt-4 flex justify-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-blue-100 animate-bounce" />
                         <div className="w-2 h-2 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: '0.2s' }} />
                         <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
