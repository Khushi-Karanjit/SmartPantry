import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clock,
  ChefHat,
  Activity,
  Terminal,
  Fingerprint,
  Zap,
  ArrowUpRight,
  History,
  Users,
  Search,
  X,
  Calendar,
  Filter
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getAdminLogsApi, getAdminUsersApi, listRecipesApi } from "../api/api";
import type { AdminCookingLog, AdminUser, Recipe } from "../api/api";

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminCookingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    userId: "",
    recipeId: "",
    days: ""
  });
  
  // Reference data for filters
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchFilterData();
  }, []);

  const fetchLogs = async (currentFilters = filters) => {
    try {
      setLoading(true);
      const res = await getAdminLogsApi(currentFilters);
      setLogs(res.logs);
      setError("");
    } catch (err: any) {
      setError(err.message || "Protocol Error: Security feed downlink failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [usersRes, recipesRes] = await Promise.all([
        getAdminUsersApi(),
        listRecipesApi({ limit: 100 })
      ]);
      setAllUsers(usersRes.users);
      setAllRecipes(recipesRes.recipes);
    } catch (err) {
      console.error("Failed to fetch filter references", err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchLogs(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = { userId: "", recipeId: "", days: "" };
    setFilters(defaultFilters);
    fetchLogs(defaultFilters);
  };

  const stats = {
    total: logs.length,
    uniqueUsers: new Set(logs.map(l => l.userId?._id)).size,
    latestEvent: logs[0]?.performedAt
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  if (loading && logs.length === 0) return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 text-blue-600">
           <Activity className="animate-pulse" size={64} />
           <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading Logs...</p>
        </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12 w-full min-w-0">
           
           {/* HEADER AREA */}
           <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2 min-w-0">
              <div className="space-y-1 min-w-0">
                 <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">Activity <span className="text-blue-600">Log</span></h1>
                 <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1 rounded-full w-fit mt-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="truncate">Monitoring: System Events</span>
                 </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto">
                 <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-xl border transition-all flex items-center justify-center gap-2 shadow-sm text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                    showFilters || filters.userId || filters.recipeId || filters.days
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                 >
                    <Filter size={16} /> {showFilters ? "Hide Filters" : "Filter"}
                    {(filters.userId || filters.recipeId || filters.days) && (
                      <span className="ml-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">!</span>
                    )}
                 </button>
                 <button className="w-full sm:w-auto bg-white text-slate-600 border border-slate-200 rounded-xl py-3 px-6 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2" onClick={() => fetchLogs()}>
                    <Zap size={16} /> Refresh
                 </button>
              </div>
           </motion.div>

           {/* QUICK STATS */}
           <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Events Profiled</p>
                 <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-slate-900">{stats.total}</h4>
                    <Activity className="text-blue-500" size={20} />
                 </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unique Operators</p>
                 <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-slate-900">{stats.uniqueUsers}</h4>
                    <Users className="text-blue-500" size={20} />
                 </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Transmission</p>
                 <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-600 truncate">
                      {stats.latestEvent ? new Date(stats.latestEvent).toLocaleString() : "Sync Offline"}
                    </h4>
                    <Clock className="text-blue-500" size={20} />
                 </div>
              </div>
           </motion.div>

           {/* FILTER DRAWER */}
           {showFilters && (
             <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }}
              className="px-2 overflow-hidden"
             >
                <div className="bg-[#FAFDFF] border border-slate-200 text-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* User Filter */}
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">User Operator</label>
                         <select 
                          value={filters.userId}
                          onChange={(e) => handleFilterChange("userId", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
                         >
                            <option value="">All Users</option>
                            {allUsers.map(u => (
                              <option key={u._id} value={u._id}>{u.username}</option>
                            ))}
                         </select>
                      </div>

                      {/* Recipe Filter */}
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Target Recipe</label>
                         <select 
                          value={filters.recipeId}
                          onChange={(e) => handleFilterChange("recipeId", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
                         >
                            <option value="">All Recipes</option>
                            {allRecipes.map(r => (
                              <option key={r._id} value={r._id}>{r.name}</option>
                            ))}
                         </select>
                      </div>

                      {/* Time Window */}
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Time Window</label>
                         <div className="flex items-center gap-2">
                            <select 
                              value={filters.days}
                              onChange={(e) => handleFilterChange("days", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
                            >
                               <option value="">All Time</option>
                               <option value="1">Last 24 Hours</option>
                               <option value="7">Last 7 Days</option>
                               <option value="30">Last Month</option>
                               <option value="90">Last 3 Months</option>
                            </select>
                            {(filters.userId || filters.recipeId || filters.days) && (
                              <button 
                                onClick={clearFilters}
                                className="p-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl transition-colors"
                              >
                                <X size={20} />
                              </button>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
           )}

           {error && (
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
                <Terminal size={18} /> {error}
             </motion.div>
           )}

           {/* MAIN TABLE SECTION */}
           <section className="bg-[#FAFDFF] border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col min-w-0 max-w-full">
              <div className="p-4 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between min-w-0">
                 <div className="flex items-center gap-3 min-w-0">
                    <Activity size={24} className="text-blue-600 shrink-0" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">System Log</h3>
                 </div>
                 <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] sm:text-xs font-bold text-blue-700 uppercase shrink-0 whitespace-nowrap">
                    Last 50 Entries
                 </div>
              </div>

              <div className="overflow-x-auto w-full max-w-full">
                 <table className="w-full text-left whitespace-nowrap min-w-full">
                    <thead>
                       <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Event</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Recipe Name</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Time</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {!loading && logs.length === 0 && (
                         <tr><td colSpan={4} className="p-20 text-center text-slate-500 text-sm">No recent activity.</td></tr>
                       )}

                       {logs.map((log: AdminCookingLog) => (
                         <motion.tr 
                           variants={item}
                           className="hover:bg-slate-50 transition-colors group" 
                           key={log._id}
                         >
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <ChefHat size={18} />
                                 </div>
                                 <div className="space-y-0.5">
                                    <span className="text-sm font-bold text-slate-900">Cooked Recipe</span>
                                    <p className="text-xs text-slate-400">ID: {log._id.slice(-6)}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Fingerprint size={16} />
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-900">{log.userId?.username || "Unknown"}</p>
                                    <p className="text-xs text-slate-400">User</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                 <p className="text-sm font-bold text-slate-900">{log.recipeId?.name || "Deleted Recipe"}</p>
                                 <p className="text-xs text-slate-400">Recipe</p>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                 <div className="flex items-center gap-2 text-blue-600 font-bold">
                                    <Clock size={16} />
                                    <span>{new Date(log.performedAt).toLocaleTimeString()}</span>
                                 </div>
                                 <p className="text-xs text-slate-500 mt-1">{new Date(log.performedAt).toLocaleDateString()}</p>
                              </div>
                           </td>
                         </motion.tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                       <Activity size={16} className="text-green-500" />
                       <p className="text-xs font-semibold">Live logging active</p>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                       <ArrowUpRight size={16} />
                       <span className="text-xs font-semibold">Export Log Data</span>
                    </div>
                 </div>
              </div>
           </section>
        </motion.div>
    </DashboardLayout>
  );
}
