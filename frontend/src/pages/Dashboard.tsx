import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatFullTimestamp } from "../utils/timeUtils";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import DashboardSkeleton from "../components/DashboardSkeleton";
import { getDashboardSummaryApi, testReportEmailApi } from "../api/api";
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
  Activity,
  Info,
  Trash2,
  Mail,
  Loader2,
  Check
} from "lucide-react";

// Removed local formatRelative in favor of centralized timeUtils.ts

function alertUi(type: "expired" | "expiring" | "low" | "info") {
  if (type === "expired") return { cls: "bg-red-500/10 text-red-500 border-red-500/20", icon: <CircleAlert size={16} /> };
  if (type === "expiring") return { cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <Clock size={16} /> };
  if (type === "info") return { cls: "bg-[#F3F4F6] text-slate-500 border-slate-200", icon: <Info size={16} /> };
  return { cls: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <TrendingDown size={16} /> };
}

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent">("idle");

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

  const handleManualEmail = async () => {
    try {
      setIsEmailing(true);
      await testReportEmailApi();
      setEmailStatus("sent");
      setTimeout(() => setEmailStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Manual email failed", err);
    } finally {
      setIsEmailing(false);
    }
  };

  const stats = data?.stats;
  const topComposition = useMemo(() => {
    const raw = data?.composition || [];
    if (raw.length <= 5) return raw;
    
    const top = raw.slice(0, 5);
    const topSum = top.reduce((s, x) => s + x.percent, 0);
    const othersPercent = Math.max(0, 100 - topSum);
    
    if (othersPercent > 0) {
      return [...top, { category: "OTHERS", count: 0, percent: othersPercent }];
    }
    return top;
  }, [data]);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
             <StatCard title="Food Items" value={`${stats?.totalItems ?? 0} ITEMS`} sub={`${stats?.capacityUsedPercent ?? 0}% capacity used`} icon={<CheckCircle2 size={20} />} variant="primary" />
             <StatCard title="Priority Alerts" value={`${stats?.expiringSoonCount ?? 0} URGENT`} sub="Expiring very soon" icon={<AlertTriangle size={20} />} variant="warning" />
             <StatCard 
               title="EXPIRED ITEMS" 
               value={`${stats?.expiredCount ?? 0} ITEMS`} 
               sub="Waiting for cleanup" 
               icon={<Trash2 size={20} />} 
               variant="danger"
             />
             <StatCard 
               title="Waste Score" 
               value={`${stats?.wasteScore ?? 0}%`} 
               sub={stats?.wasteScore && stats.wasteScore > 15 ? "Action required" : "Sustainable level"} 
               icon={<Activity size={20} />} 
               variant={stats?.wasteScore && stats.wasteScore > 15 ? "danger" : "success"}
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ALERTS TERMINAL */}
            <motion.div variants={item} className="glass-card space-y-6">
               <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Notices & Alerts</h3>
                  <button 
                    onClick={() => nav('/notifications')} 
                    className="text-xs font-bold text-blue-600 tracking-widest hover:text-blue-700 transition-colors uppercase cursor-pointer"
                  >
                    View All
                  </button>
               </div>
               
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 customize-scrollbar pb-2">
                  {data.reminders?.length ? (
                    data.reminders.slice(0, 10).map((r, idx) => {
                      const ui = alertUi(r.type as any);
                      const timeData = r.meta ? formatFullTimestamp(r.meta) : { relative: "", exact: "" };
                      const suffix = timeData.relative ? ` (${timeData.relative})` : "";
                       return (
                         <motion.div 
                           whileHover={{ scale: 1.01 }} 
                           key={idx} 
                           className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${ui.cls.replace('/10', '/30')} hover:shadow-md hover:border-blue-400/30`} 
                           title={timeData.exact}
                           onClick={() => nav('/notifications')}
                         >
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FAFDFF] border border-slate-200/50">{ui.icon}</div>
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 leading-tight">{r.text}{r.type !== 'info' && suffix}</span>
                                {r.type === 'info' && <span className="text-[10px] text-indigo-600/70 font-bold uppercase tracking-wider">{timeData.relative || 'new'}</span>}
                                {timeData.exact && r.type !== 'info' && <span className="text-[10px] text-slate-400 font-medium">{timeData.exact}</span>}
                             </div>
                           </div>
                           <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
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

                  <button 
                    onClick={handleManualEmail} 
                    disabled={isEmailing}
                    className={`group col-span-2 flex items-center justify-between p-6 rounded-2xl border transition-all text-left shadow-md
                      ${emailStatus === 'sent' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-[#FAFDFF] border-slate-200 hover:border-blue-200 hover:bg-blue-50/50'}`}
                  >
                     <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                         ${emailStatus === 'sent' ? 'bg-emerald-500 text-white' : 'bg-amber-50 text-amber-600'}`}>
                          {isEmailing ? <Loader2 className="animate-spin" size={24} /> : emailStatus === 'sent' ? <Check size={24} /> : <Mail size={24} />}
                       </div>
                       <div>
                          <p className="font-bold">{emailStatus === 'sent' ? 'Status Report Sent!' : 'Send Nightly Update Now'}</p>
                          <p className={`text-xs mt-1 ${emailStatus === 'sent' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {emailStatus === 'sent' ? 'Check your inbox for the kitchen audit.' : 'Trigger the scheduled 11:15 PM report immediately.'}
                          </p>
                       </div>
                     </div>
                     <ChevronRight size={20} className={emailStatus === 'sent' ? 'text-emerald-400' : 'text-slate-300'} />
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

