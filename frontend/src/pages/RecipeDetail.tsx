import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Flame, 
  Users, 
  Play, 
  Video, 
  ChevronRight, 
  ListChecks, 
  ChefHat, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Minus,
  Zap,
  Loader2,
  Heart,
  ShoppingCart,
  ShoppingBag
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getRecipeApi, createCookingLogApi, toggleSaveRecipeApi, addRecipeToShoppingListApi } from "../api/api";
import type { Recipe } from "../api/api";

function getYouTubeEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        let videoId = "";
        if (u.hostname.includes("youtu.be")) videoId = u.pathname.slice(1);
        else if (u.hostname.includes("youtube.com")) videoId = u.searchParams.get("v") || "";
        if (!videoId) return null;
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
    } catch { return null; }
}

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [servings, setServings] = useState(1);
    const [cooking, setCooking] = useState(false);
    const [cooked, setCooked] = useState(false);
    const [addingToList, setAddingToList] = useState(false);
    const [addedToList, setAddedToList] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => { if (id) fetchRecipe(id); }, [id]);

    const fetchRecipe = async (recipeId: string) => {
        try {
            setLoading(true);
            const res = await getRecipeApi(recipeId);
            setRecipe(res.recipe);
            setServings(1);
        } catch { setError(true); } 
        finally { setLoading(false); }
    };

    const handleToggleSave = async () => {
        if (!recipe) return;
        try {
            const res = await toggleSaveRecipeApi(recipe._id);
            setRecipe({ ...recipe, isSaved: res.saved });
        } catch (err) {
            console.error("Toggle save error", err);
        }
    };

    const handleLogCooked = async () => {
        if (!recipe || cooking) return;
        try {
            setCooking(true);
            await createCookingLogApi({ recipeId: recipe._id, servings });
            setCooked(true);
            setTimeout(() => setCooked(false), 5000);
        } catch (e: any) {
            console.error("Log error", e);
        } finally {
            setCooking(false);
        }
    };

    const handleAddToShoppingList = async () => {
        if (!recipe || !recipe.missingIngredients?.length || addingToList) return;
        try {
            setAddingToList(true);
            await addRecipeToShoppingListApi(recipe.missingIngredients);
            setAddedToList(true);
            setTimeout(() => setAddedToList(false), 3000);
        } catch (err) {
            console.error("Shopping list error", err);
        } finally {
            setAddingToList(false);
        }
    };

    const handleStepClick = (startTime: number) => {
        if (!iframeRef.current || startTime <= 0) return;
        iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "seekTo", args: [startTime, true] }),
            "*"
        );
    };

    const scaledQty = (q: number) => {
        if (!recipe) return q;
        const val = q * (servings / (recipe.servings || 1));
        return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) return (
        <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
                 <Loader2 className="animate-spin text-blue-600" size={48} />
                 <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading recipe...</p>
            </div>
        </DashboardLayout>
    );

    if (error || !recipe) return (
        <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
            <div className="bg-[#FAFDFF] border border-slate-200 rounded-3xl flex flex-col items-center justify-center min-h-[400px] text-center p-8 space-y-6 shadow-md">
                <AlertCircle size={64} className="text-slate-200" />
                <div className="space-y-2">
                   <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Recipe not found</h2>
                   <p className="text-slate-500 font-medium">We couldn't find the recipe you're looking for.</p>
                </div>
                <button onClick={() => navigate("/recipes")} className="bg-slate-900 text-white py-3 px-8 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all">Back to Recipes</button>
            </div>
        </DashboardLayout>
    );

    const embedUrl = recipe.videoUrl ? getYouTubeEmbedUrl(recipe.videoUrl) : null;
    const hasVideo = !!embedUrl;

    return (
        <DashboardLayout topbar={(openMenu) => (
            <Topbar 
                onOpenMenu={openMenu}
                customTitle={
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all" onClick={() => navigate("/recipes")}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900 line-clamp-1 uppercase">{recipe.name}</h1>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               <ChefHat size={12} className="text-blue-500" />
                               <span>{recipe.cuisine} &middot; {recipe.prepMinutes}m prep</span>
                            </div>
                        </div>
                    </div>
                }
                customActions={
                    <div className="flex items-center gap-3">
                        {hasVideo && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Video Guide
                            </div>
                        )}
                        <button 
                            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md ${cooked ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`} 
                            onClick={handleLogCooked}
                            disabled={cooking}
                        >
                            {cooking ? <Loader2 className="animate-spin" size={14} /> : cooked ? <CheckCircle size={14} /> : <Zap size={14} />}
                            {cooking ? "Logging..." : cooked ? "Logged!" : `Log ${servings} Serving${servings !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                }
            />
        )}>
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
                
                {/* CINEMA HUB */}
                <motion.div variants={item} className="relative">
                    <div className="bg-[#FAFDFF] border border-slate-200 p-0 overflow-hidden shadow-md rounded-[2.5rem] relative">
                        {hasVideo ? (
                            <div className="relative aspect-video">
                                <iframe
                                    ref={iframeRef}
                                    src={embedUrl!}
                                    title={recipe.name}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                                <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-slate-200 shadow-md backdrop-blur-md pointer-events-none">
                                    <Video size={16} />
                                    <span>Interactive Guide</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative aspect-[21/9] overflow-hidden">
                                <img src={recipe.imageUrl || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200"} alt={recipe.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                            </div>
                        )}
                        
                        {/* Floating Heart Button */}
                        <button 
                            className={`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-xl z-10 ${recipe.isSaved ? "bg-pink-500 text-white shadow-pink-500/30" : "bg-white/90 text-slate-400 hover:bg-white hover:text-pink-500 hover:scale-110"}`}
                            onClick={handleToggleSave}
                        >
                            <Heart size={22} fill={recipe.isSaved ? "currentColor" : "none"} />
                        </button>
                    </div>
                </motion.div>

                {/* TELEMETRY ENGINE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT PANEL: DETAILS */}
                    <div className="lg:col-span-4 space-y-8">
                        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-[#FAFDFF] border border-slate-200 shadow-md rounded-3xl flex flex-col items-center text-center gap-2 p-5">
                                <Clock size={16} className="text-blue-500" />
                                <span className="text-lg font-bold text-slate-800">{recipe.prepMinutes}m</span>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prep Time</label>
                            </div>
                            <div className="bg-[#FAFDFF] border border-slate-200 shadow-md rounded-3xl flex flex-col items-center text-center gap-2 p-5">
                                <Flame size={16} className="text-orange-500" />
                                <span className="text-lg font-bold text-slate-800">{recipe.calories ? Math.round(recipe.calories * (servings / (recipe.servings || 1))) : "---"}</span>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Calories</label>
                            </div>
                            <div className="bg-[#FAFDFF] border border-slate-200 shadow-md rounded-3xl flex flex-col items-center text-center gap-2 p-5">
                                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">PRO</div>
                                <span className="text-lg font-bold text-slate-800">{recipe.protein ? Math.round(recipe.protein * (servings / (recipe.servings || 1))) : "0"}g</span>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protein</label>
                            </div>
                            <div className="bg-[#FAFDFF] border border-slate-200 shadow-md rounded-3xl flex flex-col items-center text-center gap-2 p-5">
                                <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">CAR</div>
                                <span className="text-lg font-bold text-slate-800">{recipe.carbs ? Math.round(recipe.carbs * (servings / (recipe.servings || 1))) : "0"}g</span>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Carbs</label>
                            </div>
                            <div className="bg-[#FAFDFF] border border-slate-200 shadow-md rounded-3xl flex flex-col items-center text-center gap-2 p-5">
                                <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">FAT</div>
                                <span className="text-lg font-bold text-slate-800">{recipe.fat ? Math.round(recipe.fat * (servings / (recipe.servings || 1))) : "0"}g</span>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fat</label>
                            </div>
                            <div className="bg-[#FAFDFF] border border-slate-200 shadow-md rounded-3xl flex flex-col items-center text-center gap-2 p-4">
                                <Users size={16} className="text-blue-500" />
                                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200">
                                    <button className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#FAFDFF] border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-colors" onClick={() => setServings(Math.max(1, servings - 1))}><Minus size={12} /></button>
                                    <span className="text-xs font-bold w-4 text-slate-700 text-center">{servings}</span>
                                    <button className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#FAFDFF] border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-colors" onClick={() => setServings(servings + 1)}><Plus size={12} /></button>
                                </div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Servings</label>
                            </div>
                        </motion.div>

                        {/* MISSING INGREDIENTS ADVISORY */}
                        {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                            <motion.section variants={item} className="bg-amber-50/50 border border-amber-100 shadow-md rounded-3xl p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Missing Items</h3>
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{recipe.missingIngredients.length} ingredients needed</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddToShoppingList}
                                        disabled={addingToList || addedToList}
                                        className={`p-2 rounded-xl transition-all ${addedToList ? "bg-emerald-500 text-white" : "bg-white border border-amber-200 text-amber-600 hover:bg-amber-100"}`}
                                    >
                                        {addingToList ? <Loader2 size={18} className="animate-spin" /> : addedToList ? <CheckCircle size={18} /> : <ShoppingCart size={18} />}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {recipe.missingIngredients.map((ing, i) => (
                                        <div key={i} className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                                            <span className="text-slate-600">{ing.name}</span>
                                            <span className="text-amber-600">{ing.quantity} {ing.unit}</span>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleAddToShoppingList}
                                    disabled={addingToList || addedToList}
                                    className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${addedToList ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600"}`}
                                >
                                    {addingToList ? "Adding to list..." : addedToList ? "Added to List!" : "Add Missing to Shopping List"}
                                </button>
                            </motion.section>
                        )}

                        <motion.section variants={item} className="bg-[#FAFDFF] border border-slate-200 shadow-md rounded-3xl space-y-8 p-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><ListChecks size={20} /></div>
                                <h3 className="text-lg font-bold uppercase tracking-widest text-slate-900">Ingredients</h3>
                            </div>
                            <div className="space-y-4">
                                {(recipe.ingredients || []).map((ing: any, idx: number) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + (idx * 0.05) }}
                                        key={idx} 
                                        className="flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                           <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-500 transition-all duration-300" />
                                           <span className="text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors">{ing.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors tracking-widest">{scaledQty(ing.quantity)} {ing.unit}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    </div>

                    {/* RIGHT PANEL: METHOD */}
                    <div className="lg:col-span-8">
                        <motion.section variants={item} className="bg-[#FAFDFF] border border-slate-200 shadow-md rounded-3xl space-y-8 p-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Zap size={20} /></div>
                                <h3 className="text-lg font-bold uppercase tracking-widest text-slate-900">Cooking steps</h3>
                            </div>
                            <div className="space-y-6">
                                {(recipe.steps || []).map((step: any, idx: number) => {
                                    const ts = step.startTime ?? 0;
                                    const hasTs = hasVideo && ts > 0;
                                    const min = Math.floor(ts / 60);
                                    const sec = String(ts % 60).padStart(2, "0");
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + (idx * 0.1) }}
                                            key={idx}
                                            onClick={() => hasTs && handleStepClick(ts)}
                                            className={`group flex gap-6 p-6 rounded-3xl transition-all border
                                                ${hasTs 
                                                  ? "bg-slate-50 border-slate-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200" 
                                                  : "bg-white border-slate-50 hover:bg-slate-50"
                                                }
                                            `}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                               <div className="w-12 h-12 rounded-2xl bg-[#FAFDFF] border border-slate-200 flex items-center justify-center text-xs font-bold group-hover:text-blue-600 transition-colors shadow-md">
                                                  {hasTs ? <Play size={14} className="text-blue-600" fill="currentColor" /> : idx + 1}
                                               </div>
                                               {idx < (recipe.steps || []).length - 1 && <div className="w-0.5 flex-1 bg-slate-100 group-hover:bg-blue-100 transition-colors" />}
                                            </div>
                                            
                                            <div className="flex-1 space-y-3 pt-2">
                                                <p className="text-slate-500 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">{step.text}</p>
                                                {hasTs && (
                                                   <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-[10px]">
                                                      <Clock size={12} /> Watch: {min}:{sec}
                                                   </div>
                                                )}
                                            </div>
                                            {hasTs && <ChevronRight size={18} className="self-center text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.section>
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
