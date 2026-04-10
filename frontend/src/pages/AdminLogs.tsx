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
  History
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getAdminLogsApi } from "../api/api";
import type { AdminCookingLog } from "../api/api";

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminCookingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAdminLogsApi();
      setLogs(res.logs);
      setError("");
    } catch (err: any) {
      setError(err.message || "Protocol Error: Security feed downlink failed");
    } finally {
      setLoading(false);
    }
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
                 <div className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-[#FAFDFF] border border-slate-200 text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
                    <History size={16} /> Filter
                 </div>
                 <button className="w-full sm:w-auto bg-blue-600 text-white rounded-2xl py-3 px-6 text-xs font-bold uppercase tracking-widest shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2" onClick={fetchLogs}>
                    <Zap size={16} /> Refresh
                 </button>
              </div>
           </motion.div>

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
