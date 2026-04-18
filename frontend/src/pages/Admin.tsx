import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Refrigerator,
  Zap,
  Flame,
  Utensils,
  Activity,
  ShieldAlert,
  Terminal,
  Search
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getUser } from "../auth/auth";
import {
  getAdminStatsApi,
  getAdminActivitiesApi,
  updateRecipeStatusApi,
  deleteRecipeApi,
  type AdminStats,
  type AdminActivity
} from "../api/api";

function statusClass(status: string) {
  if (status === "published") return "bg-green-50 text-green-700 border-green-200";
  if (status === "draft") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function Admin() {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recipes, setRecipes] = useState<AdminActivity[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes] = await Promise.all([
        getAdminStatsApi(),
        getAdminActivitiesApi(),
      ]);
      setStats(statsRes.stats);
      setRecipes(activitiesRes.recentRecipes);
      setPopularRecipes(activitiesRes.popularRecipes);
      setError("");
    } catch (err: any) {
      setError(err.message || "Protocol Error: Admin downlink rejected");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      await updateRecipeStatusApi(id, newStatus);
      fetchAdminData();
    } catch (err: any) {
      console.error(err.message || "Override Refused: Status update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CONFIRM DELETION: This action cannot be reverted.")) return;
    try {
      await deleteRecipeApi(id);
      fetchAdminData();
    } catch (err: any) {
      console.error(err.message || "Security Violation: Deletion refused");
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

  if (loading && !stats) return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 text-blue-600">
           <Terminal className="animate-pulse" size={64} />
           <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading Admin Dashboard...</p>
        </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
        
        {/* HEADER */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2 min-w-0">
           <div className="space-y-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">Admin <span className="text-blue-600">Dashboard</span></h1>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1 rounded-full w-fit mt-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                 <span className="truncate">Status: Active &bull; Admin: {user?.username}</span>
              </div>
           </div>
           <div className="flex items-center gap-4 shrink-0">
              <button 
                className="bg-blue-600 text-white rounded-xl py-3 px-4 sm:px-6 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                onClick={() => navigate("/admin/recipes/new")}
              >
                <Plus size={16} />
                Create Recipe
              </button>
           </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
             <ShieldAlert size={18} /> {error}
          </motion.div>
        )}

        {/* STATS MATRIX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-5 w-full min-w-0">
           {[
             { l: "TOTAL RECIPES", v: stats?.totalRecipes, s: `${stats?.publishedRecipes} Published`, i: <BookOpen size={20} />, c: "text-blue-600", bg: "bg-blue-50" },
             { l: "TOTAL USERS", v: stats?.totalUsers, s: "Active Community", i: <Users size={20} />, c: "text-amber-600", bg: "bg-amber-50" },
             { l: "PANTRY ITEMS", v: stats?.totalPantryItems, s: "Tracked Ingredients", i: <Refrigerator size={20} />, c: "text-green-600", bg: "bg-green-50" },
             { l: "COOKING ACTIVITY", v: stats?.totalCookingActivities, s: "Meals Cooked", i: <Zap size={20} />, c: "text-red-600", bg: "bg-red-50" }
           ].map(s => (
             <motion.div key={s.l} variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 min-w-0 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg} ${s.c}`}>
                      {s.i}
                   </div>
                   <div className="flex flex-col items-end min-w-0">
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">{s.v ?? 0}</p>
                   </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-0.5 min-w-0">
                   <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{s.l}</p>
                   <p className={`text-[10px] font-semibold truncate ${s.c}`}>{s.s}</p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* HIGH-VALUE ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-5 w-full min-w-0">
           <motion.div variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 min-w-0 w-full overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                 <Flame size={24} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Most Cooked Recipe</p>
                 <h4 className="text-lg font-bold text-slate-900 truncate w-full">{stats?.mostCookedRecipe || "None Yet"}</h4>
              </div>
           </motion.div>
           
           <motion.div variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 min-w-0 w-full overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                 <Utensils size={24} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Top Ingredient</p>
                 <h4 className="text-lg font-bold text-slate-900 truncate w-full">{stats?.mostUsedIngredient || "None Yet"}</h4>
              </div>
           </motion.div>
        </div>

        {/* DATA LOGS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full min-w-0">
           {/* RECENT ACTIVITY TABLE */}
           <motion.div variants={item} className="xl:col-span-8 bg-[#FAFDFF] border border-slate-200 rounded-3xl shadow-lg min-w-0 flex flex-col overflow-hidden max-w-full hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-white z-10 w-full min-w-0">
                  <div className="space-y-1 shrink-0">
                     <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Recent Recipes</h3>
                     <p className="text-xs sm:text-sm text-slate-500 truncate">Manage and oversee the recipe catalog</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto min-w-0">
                     <button 
                        onClick={() => navigate("/admin/recipes")}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all shrink-0"
                     >
                        Manage All
                     </button>
                  </div>
              </div>
              
              <div className="overflow-x-auto w-full max-w-full">
                 <table className="w-full text-left whitespace-nowrap min-w-full">
                    <thead>
                       <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Recipe Name</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Last Updated</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {recipes.length === 0 && (
                         <tr><td colSpan={4} className="p-12 text-center text-slate-500 text-sm">No recipes found.</td></tr>
                       )}
                       {recipes.map((recipe) => (
                         <tr className="hover:bg-slate-50 transition-colors group" key={recipe._id}>
                            <td className="px-6 py-4">
                               <p className="text-sm font-bold text-slate-900">{recipe.name}</p>
                               <p className="text-xs text-slate-400 mt-0.5">ID: {recipe._id.slice(-6)}</p>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase ${statusClass(recipe.status)}`}>
                                  {recipe.status}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm text-slate-500">{new Date(recipe.updatedAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => navigate(`/admin/recipes/edit/${recipe._id}`)}>
                                     <Pencil size={16} />
                                  </button>
                                  <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => handleStatusUpdate(recipe._id, recipe.status)}>
                                     {recipe.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                  <button className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors" onClick={() => handleDelete(recipe._id)}>
                                     <Trash2 size={16} />
                                  </button>
                                </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </motion.div>

           {/* POPULAR RECIPES LITE */}
           <motion.div variants={item} className="xl:col-span-4 space-y-8 min-w-0 max-w-full">
              <section className="bg-[#FAFDFF] border border-slate-200 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 min-w-0 flex flex-col overflow-hidden">
                 <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                       <Activity size={20} className="text-blue-600 shrink-0" />
                       <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Most Popular</h3>
                    </div>
                 </div>
                 
                 <div className="divide-y divide-slate-50 w-full min-w-0 overflow-x-hidden">
                    {popularRecipes.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No data available.</div>}
                    {popularRecipes.map((recipe, idx) => (
                      <div className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 min-w-0" key={recipe._id}>
                        <div className="text-lg font-bold text-slate-300 w-6 text-center shrink-0">{idx + 1}</div>
                        <div className="flex-1 min-w-0 space-y-1">
                           <p className="text-sm font-bold text-slate-900 truncate w-full">{recipe.name}</p>
                           <div className="flex items-center justify-between">
                              <p className="text-xs text-slate-500 capitalize">{recipe.status}</p>
                              <p className="text-xs font-bold text-blue-600 shrink-0">{recipe.views ?? 0} Views</p>
                           </div>
                        </div>
                        <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center shrink-0" onClick={() => navigate(`/admin/recipes/edit/${recipe._id}`)}>
                           <Pencil size={16} />
                        </button>
                      </div>
                    ))}
                 </div>
              </section>

              <div className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                 <div className="flex items-center gap-3 text-slate-900">
                    <ShieldCheck size={24} className="text-green-500" />
                    <h4 className="text-lg font-bold">System Status</h4>
                 </div>
                 <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 w-[94%]" />
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                       <span>Server Health</span>
                       <span className="text-blue-600">Optimal</span>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

