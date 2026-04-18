import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Search, 
  Clock, 
  Flame, 
  ArrowRight,
  Loader2,
  Bookmark
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getSavedRecipesApi, type Recipe } from "../api/api";

export default function SavedRecipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const fetchSavedRecipes = async () => {
    try {
      setLoading(true);
      const res = await getSavedRecipesApi();
      setRecipes(res.recipes);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch saved recipes");
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine?.toLowerCase().includes(search.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="space-y-8 pb-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              My <span className="text-pink-500">Favourites</span>
              <Heart className="text-pink-500 fill-pink-500" size={28} />
            </h2>
            <p className="text-slate-500 text-sm">Recipes you've bookmarked to cook later.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all shadow-sm"
              placeholder="Search favourites..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* CONTENT */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[400px] flex flex-col items-center justify-center space-y-4"
            >
              <Loader2 className="animate-spin text-pink-500" size={48} />
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading your favorites...</p>
            </motion.div>
          ) : filteredRecipes.length > 0 ? (
            <motion.div 
              key="list"
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredRecipes.map(recipe => (
                <motion.div 
                  key={recipe._id}
                  variants={item}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
                  onClick={() => navigate(`/recipes/${recipe._id}`)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={recipe.imageUrl || "https://placehold.co/600x400?text=Recipe"} 
                      alt={recipe.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute top-4 right-4">
                        <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-pink-500 shadow-lg shadow-pink-500/20">
                            <Heart size={20} fill="currentColor" />
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="px-2 py-1 rounded-lg bg-pink-500/80 backdrop-blur-md text-[10px] font-black uppercase tracking-tighter mb-2 inline-block">
                            {recipe.cuisine || "Global"}
                        </span>
                        <h3 className="text-lg font-bold leading-tight line-clamp-1">{recipe.name}</h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                            <Clock size={14} className="text-pink-400"/> {recipe.prepMinutes} min
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                            <Flame size={14} className="text-pink-400"/> {Math.round(recipe.calories || 0)} kcal
                        </div>
                    </div>
                    
                    <button className="w-full py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:bg-pink-500 group-hover:text-white group-hover:border-pink-500 transition-all flex items-center justify-center gap-2">
                        Start Cooking <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#FAFDFF] border-2 border-dashed border-slate-200 rounded-[3rem] p-24 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-200">
                <Bookmark size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">Your favourites list is empty</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {search ? `No saved recipes match "${search}"` : "You haven't bookmarked any recipes yet. Start exploring and save what looks delicious!"}
                </p>
              </div>
              {!search && (
                <button 
                  onClick={() => navigate("/recipes")}
                  className="bg-pink-500 text-white px-8 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200"
                >
                  Browse Recipes
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
