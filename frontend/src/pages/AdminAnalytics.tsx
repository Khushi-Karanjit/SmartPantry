import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  PieChart as PieChartIcon,
  Activity,
  Zap,
  ShieldCheck,
  Terminal,
  ArrowUpRight,
  Database,
  Layers
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getAdminAnalyticsApi } from "../api/api";
import type { AdminAnalytics as AdminAnalyticsType } from "../api/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6", "#6366f1"];

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getAdminAnalyticsApi();
      setData(res);
      setError("");
    } catch (err: any) {
      setError(err.message || "Protocol Error: Telemetry downlink failed");
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

  if (loading && !data) return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 text-blue-600">
           <Activity className="animate-pulse" size={64} />
           <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading Analytics...</p>
        </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
           
           {/* HEADER SECTION */}
           <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
              <div className="space-y-1">
                 <h1 className="text-3xl font-bold tracking-tight text-slate-900">System <span className="text-blue-600">Analytics</span></h1>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1 rounded-full w-fit mt-2">
                    <ShieldCheck size={12} className="text-green-600" />
                    System Status: Healthy
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="px-6 py-3 rounded-2xl bg-[#FAFDFF] border border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 shadow-md">
                    <Database size={16} /> Live Data Log
                 </div>
                 <button className="bg-blue-600 text-white rounded-2xl py-3 px-6 text-xs font-bold uppercase tracking-widest shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <ArrowUpRight size={16} /> Full Report
                 </button>
              </div>
           </motion.div>

           {error && (
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
                <Terminal size={18} /> {error}
             </motion.div>
           )}

           {/* TOP CHARTS */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full min-w-0 max-w-full">
              
              {/* RECIPE POPULARITY CHART */}
              <motion.section variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col min-w-0 max-w-full">
                 <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                       <TrendingUp size={20} className="text-green-600 shrink-0" />
                       <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Most Cooked</h3>
                    </div>
                    <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-green-50 border border-green-200 text-[10px] sm:text-xs font-bold text-green-700 uppercase tracking-widest shrink-0">
                       Live Feed
                    </div>
                 </div>

                 <div className="p-4 sm:p-6 space-y-8 w-full min-w-0">
                    <div className="h-[250px] sm:h-[300px] w-full mt-4 min-w-0">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={data?.mostCooked || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" hide />
                           <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                           <Tooltip 
                             content={<CustomTooltip />} 
                             cursor={{ fill: 'rgba(0,0,0,0.02)' }} 
                           />
                           <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                             {(data?.mostCooked || []).map((_item: any, index: number) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                       {(data?.mostCooked || []).map((item: any, idx: number) => (
                         <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors min-w-0" key={idx}>
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                           </div>
                           <div className="flex items-baseline gap-1 shrink-0">
                              <span className="text-sm sm:text-lg font-bold text-slate-900">{item.count}</span>
                              <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">COOKS</span>
                           </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.section>

              {/* INGREDIENT POPULARITY CHART */}
              <motion.section variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col min-w-0 max-w-full">
                 <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                       <PieChartIcon size={20} className="text-blue-600 shrink-0" />
                       <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Top Ingredients</h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-blue-50 text-[10px] sm:text-xs font-bold text-blue-600 uppercase shrink-0">
                       Archive Data
                    </div>
                 </div>

                 <div className="p-4 sm:p-6 w-full min-w-0 space-y-8">
                    <div className="h-[300px] w-full mt-4">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart layout="vertical" data={data?.ingredientStats || []} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="5 5" horizontal={false} stroke="#f1f5f9" />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" hide />
                           <Tooltip 
                              content={<CustomTooltip />} 
                              cursor={{ fill: 'rgba(0,0,0,0.02)' }} 
                           />
                           <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                             {(data?.ingredientStats || []).map((_item: any, index: number) => (
                               <Cell key={`cell-ing-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {(data?.ingredientStats || []).map((item: any, idx: number) => (
                         <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors" key={idx}>
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                              <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                           </div>
                           <div className="flex items-baseline gap-1 flex-shrink-0">
                              <span className="text-lg font-bold text-slate-900">{item.count}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">USES</span>
                           </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.section>
           </div>

           {/* SYSTEM HEALTH CARDS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { l: "Platform Uptime", v: "99.98%", i: <Zap size={20} />, border: "border-yellow-200", iconBg: "bg-yellow-50 text-yellow-600" },
                { l: "Network Speed", v: "1.2 GB/S", i: <Activity size={20} />, border: "border-green-200", iconBg: "bg-green-50 text-green-600" },
                { l: "Data Integrity", v: "Optimized", i: <Layers size={20} />, border: "border-blue-200", iconBg: "bg-blue-50 text-blue-600" }
              ].map(s => (
                <motion.div key={s.l} variants={item} className={`bg-white border rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow ${s.border}`}>
                   <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.l}</p>
                      <h4 className="text-xl font-bold text-slate-900 tracking-tight">{s.v}</h4>
                   </div>
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                      {s.i}
                   </div>
                </motion.div>
              ))}
           </div>
        </motion.div>
    </DashboardLayout>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#FAFDFF] border border-slate-200 rounded-xl p-4 shadow-lg">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">
          Usage Record
        </p>
        <div className="space-y-2">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-8">
               <span className="text-sm font-bold text-slate-700">{p.payload.name || "Item"}</span>
               <span className="text-lg font-bold" style={{ color: p.color || p.fill }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
