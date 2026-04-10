import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import DashboardSkeleton from "../components/DashboardSkeleton";
import { getDashboardSummaryApi } from "../api/api";
import type { DashboardSummary } from "../api/api";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  CircleAlert,
  TrendingDown,
  ChevronRight,
  Sparkles,
  PlusSquare,
  Activity
} from "lucide-react";

function formatRelative(metaIso: string) {
  const d = new Date(metaIso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;
  }
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "in 1 day";
  return `in ${diffDays} days`;
}

function alertUi(type: "expired" | "expiring" | "low") {
  if (type === "expired") return { cls: "bg-red-500/10 text-red-500 border-red-500/20", icon: <CircleAlert size={16} /> };
  if (type === "expiring") return { cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <Clock size={16} /> };
  return { cls: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <TrendingDown size={16} /> };
}

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const summary = await getDashboardSummaryApi();
        if (alive) setData(summary);
      } catch (e: any) {
        if (alive) setError(e?.message || "Something went wrong. Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const stats = data?.stats;
  const topComposition = useMemo(() => (data?.composition || []).slice(0, 4), [data]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      {loading && <DashboardSkeleton />}

      {!loading && error && (
        <div className="glass-card text-center py-12 space-y-4 bg-red-50 border-red-100">
          <AlertTriangle size={48} className="text-red-500 mx-auto" />
          <h3 className="text-xl font-bold">Something went wrong</h3>
          <p className="text-slate-600">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
          
          {/* WELCOME BANNER */}
          {stats?.totalItems === 0 && (
            <motion.div variants={item} className="glass-card bg-blue-50 p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-blue-100">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">READY TO START?</h2>
                <p className="text-slate-600">Your kitchen is empty. Let's add some items to get started.</p>
              </div>
              <button onClick={() => nav('/pantry-setup')} className="btn-futuristic whitespace-nowrap px-8">Set Up My Kitchen</button>
            </motion.div>
          )}

          {/* STATS ENGINE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard title="Food Items" value={`${stats?.totalItems ?? 0} ITEMS`} sub={`${stats?.capacityUsedPercent ?? 0}% capacity used`} icon={<CheckCircle2 size={20} />} />
             <StatCard title="Priority Alerts" value={`${stats?.expiringSoonCount ?? 0} URGENT`} sub="Expiring very soon" icon={<AlertTriangle size={20} />} />
             <StatCard title="Planned Meals" value={`${stats?.mealsPlannedToday ?? 0} TODAY`} sub="Ready for your day" icon={<Activity size={20} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ALERTS TERMINAL */}
            <motion.div variants={item} className="glass-card space-y-6">
               <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Notices & Alerts</h3>
                  <a href="#" className="text-xs font-bold text-blue-600 tracking-widest hover:text-blue-700 transition-colors uppercase">View All</a>
               </div>
               
               <div className="space-y-3">
                 {data.reminders?.length ? (
                   data.reminders.slice(0, 3).map((r, idx) => {
                     const ui = alertUi(r.type);
                     const suffix = r.meta && (r.type === "expired" || r.type === "expiring") ? ` (${formatRelative(r.meta)})` : "";
                      return (
                        <motion.div whileHover={{ scale: 1.01 }} key={idx} className={`flex items-center justify-between p-4 rounded-xl border ${ui.cls.replace('/10', '/30')}`}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FAFDFF] border border-slate-200/50">{ui.icon}</div>
                            <span className="text-sm font-bold text-slate-700">{r.text}{suffix}</span>
                          </div>
                          <ChevronRight size={16} className="text-slate-300" />
                        </motion.div>
                      );
                   })
                 ) : (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                       <CheckCircle2 size={32} className="text-green-500/20" />
                       <p className="text-xs font-bold tracking-widest uppercase">Everything is looking good!</p>
                    </div>
                 )}
               </div>
            </motion.div>

            {/* KITCHEN COMMANDS */}
            <motion.div variants={item} className="glass-card space-y-6">
               <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 px-1">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => nav('/recipe-suggester')} className="group flex flex-col p-6 rounded-2xl bg-[#FAFDFF] border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left space-y-4 shadow-md">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform"><Sparkles size={24} /></div>
                     <div>
                        <p className="font-bold text-slate-800">Get Recipe Ideas</p>
                        <p className="text-xs text-slate-500 mt-1">Discover what you can cook with your food.</p>
                     </div>
                  </button>
                  <button onClick={() => nav('/pantry-setup')} className="group flex flex-col p-6 rounded-2xl bg-[#FAFDFF] border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left space-y-4 shadow-md">
                     <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform"><PlusSquare size={24} /></div>
                     <div>
                        <p className="font-bold text-slate-800">My Kitchen Setup</p>
                        <p className="text-xs text-slate-500 mt-1">Easily add new items to your kitchen.</p>
                     </div>
                  </button>
               </div>
            </motion.div>

            {/* COMPOSITION TELEMETRY */}
            <motion.div variants={item} className="glass-card space-y-6 lg:col-span-2">
               <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 px-1">Food Trends</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 px-1">
                  {topComposition.length ? (
                    topComposition.map((c) => (
                      <div key={c.category} className="space-y-3">
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{c.category}</span>
                           <span className="text-xs font-bold text-blue-600">{c.percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: `${c.percent}%` }} 
                             transition={{ duration: 1.5, ease: "circOut" }}
                             className="h-full bg-blue-600" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm">No data available yet.</p>
                  )}
               </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}

