import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  Loader2,
  ShieldAlert
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import {
  getAdminRecipesApi,
  updateRecipeStatusApi,
  deleteRecipeApi,
  type Recipe,
  type PaginationMeta
} from "../api/api";

function statusClass(status: string) {
  if (status === "published") return "bg-green-50 text-green-700 border-green-200";
  if (status === "draft") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (status === "archived") return "bg-red-50 text-red-700 border-red-100";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function AdminManageRecipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchRecipes();
  }, [page, status]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchRecipes();
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await getAdminRecipesApi({ page, limit: 12, search, status });
      setRecipes(res.recipes);
      setPagination(res.pagination);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch recipes");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    try {
      // Logic: Published -> Draft, Draft -> Published, Archived -> Draft
      let newStatus = "published";
      if (currentStatus === "published") newStatus = "draft";
      else if (currentStatus === "draft") newStatus = "published";
      else if (currentStatus === "archived") newStatus = "draft";

      await updateRecipeStatusApi(id, newStatus);
      fetchRecipes();
    } catch (err: any) {
      setError("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CONFIRM DELETION: This action cannot be reverted.")) return;
    try {
      await deleteRecipeApi(id);
      fetchRecipes();
    } catch (err: any) {
      setError("Failed to delete recipe");
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

  return (
    <DashboardLayout topbar={(openMenu) => (
      <Topbar 
        onOpenMenu={openMenu}
        customTitle={
            <div className="flex items-center gap-4">
                <button 
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all" 
                  onClick={() => navigate("/admin")}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Manage <span className="text-blue-600">Recipes</span></h1>
            </div>
        }
      />
    )}>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
        
        {/* FILTERS & SEARCH */}
        <motion.div variants={item} className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="relative w-full md:max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                className="w-full bg-[#FAFDFF] border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                placeholder="Search recipe catalog..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                 <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <select 
                    className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                 >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                 </select>
              </div>
              <button 
                className="bg-blue-600 text-white rounded-xl py-2.5 px-6 text-xs font-bold uppercase tracking-widest shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 shrink-0"
                onClick={() => navigate("/admin/recipes/new")}
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add New</span>
              </button>
           </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
             <ShieldAlert size={18} /> {error}
          </motion.div>
        )}

        {/* RECIPE TABLE */}
        <motion.div variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl shadow-lg flex flex-col overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                            <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Recipe</th>
                            <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Category & Stats</th>
                            <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Updated</th>
                            <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-8">
                                        <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-2" />
                                        <div className="h-3 bg-slate-50 rounded-full w-1/2" />
                                    </td>
                                </tr>
                            ))
                        ) : recipes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-400">
                                        <BookOpen size={48} strokeWidth={1} />
                                        <p className="text-sm font-bold uppercase tracking-widest">No recipes found in catalog</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            recipes.map((recipe) => (
                                <tr key={recipe._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                <img src={recipe.imageUrl || "https://placehold.co/100x100?text=NA"} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{recipe.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">ID: {recipe._id.slice(-8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{recipe.cuisine || "Global"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    <Eye size={10} /> {recipe.views || 0}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400">{recipe.ingredients?.length || 0} Ingredients</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${statusClass(recipe.status)}`}>
                                            {recipe.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-xs font-bold text-slate-600">{new Date(recipe.updatedAt || "").toLocaleDateString()}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(recipe.updatedAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:text-blue-600 hover:border-blue-400 hover:shadow-sm transition-all"
                                                onClick={() => navigate(`/admin/recipes/edit/${recipe._id}`)}
                                                title="Edit Recipe"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${recipe.status === "published" ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-blue-50 border-blue-200 text-blue-600"}`}
                                                onClick={() => handleStatusUpdate(recipe._id, recipe.status)}
                                                title={recipe.status === "published" ? "Unpublish" : "Publish"}
                                            >
                                                {recipe.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button 
                                                className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                onClick={() => handleDelete(recipe._id)}
                                                title="Delete Recipe"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            {pagination && pagination.totalPages > 1 && (
                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-slate-900">{((page - 1) * pagination.limit) + 1}</span> to <span className="text-slate-900">{Math.min(page * pagination.limit, pagination.total)}</span> of <span className="text-slate-900">{pagination.total}</span> recipes
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold">
                            {page}
                        </div>
                        <button 
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
