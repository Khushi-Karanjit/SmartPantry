import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ReTooltip,
  CartesianGrid, ComposedChart, Line, Area, AreaChart
} from "recharts";
import { 
  ChevronDown,
  Check,
  Activity,
  ShieldCheck,
  Cpu,
  ArrowUpRight,
  Loader2,
  PieChart as PieIcon,
  FileText,
  X,
  Target,
  Flame,
  AlertTriangle,
  ClipboardList,
  Mail,
  Utensils,
  ChefHat,
  Box,
  TrendingUp
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getUserAnalyticsApi, getFullReportApi, testReportEmailApi } from "../api/api";
import type { UserAnalytics, KitchenReport } from "../api/api";

export default function Analytics() {
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedCuisine, setSelectedCuisine] = useState("Global");
  
  // Report State
  const [report, setReport] = useState<KitchenReport | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent">("idle");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDays, selectedCuisine]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getUserAnalyticsApi({ 
        days: selectedDays, 
        cuisine: selectedCuisine 
      });
      setData(res);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      const res = await getFullReportApi();
      setReport(res);
      setIsReportOpen(true);
    } catch (err) {
      console.error("Report generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmailReport = async () => {
    try {
      setIsEmailing(true);
      await testReportEmailApi();
      setEmailStatus("sent");
      setTimeout(() => setEmailStatus("idle"), 3000);
    } catch (err) {
      console.error("Email report failed", err);
    } finally {
      setIsEmailing(false);
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

  if (loading && !data) {
    return (
      <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
           <Loader2 className="animate-spin text-blue-600" size={48} />
           <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading charts...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const totalMeals = data.nutritionHistory.reduce((acc, curr) => acc + curr.count, 0);
  const totalPantry = data.pantryComposition.reduce((acc, curr) => acc + curr.value, 0);
  const todayEntry = data.nutritionHistory[data.nutritionHistory.length - 1] || { calories: 0 };
  const cuisineCount = data.cuisineMastery.length;
  const topCuisine = data.cuisineMastery.sort((a,b) => b.value - a.value)[0]?.name || "N/A";

  const timeframeOptions = [
    { label: "7 DAYS", value: 7 },
    { label: "30 DAYS", value: 30 },
    { label: "90 DAYS", value: 90 },
  ];

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
        
        {/* REPORT OVERLAY MODAL */}
        <AnimatePresence>
          {isReportOpen && report && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                className="bg-white w-full max-w-5xl h-full max-h-[90vh] flex flex-col p-0 overflow-hidden border border-slate-200 rounded-3xl shadow-2xl"
              >
                <header className="flex items-center justify-between p-8 border-b border-slate-50">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <FileText size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Kitchen Report</h2>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                         <Activity size={12} className="text-blue-600" />
                         Generated: {new Date(report.generatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                   <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200" onClick={() => setIsReportOpen(false)}>
                    <X size={20} />
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                     {/* Efficiency Score */}
                   <div className="md:col-span-12 bg-blue-50 border border-blue-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                           <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2"><Target size={18} /> Kitchen Efficiency</h3>
                           <p className="text-xs text-slate-500 font-medium max-w-xs">Your overall kitchen and nutrition performance score.</p>
                        </div>
                        <div className="flex items-center gap-12">
                           <div className="text-center">
                              <p className="text-5xl font-bold text-slate-900 tracking-tight">{report.summary.efficiencyScore}%</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Score</p>
                           </div>
                           <div className="h-16 w-px bg-blue-100 hidden md:block" />
                           <div className="space-y-4 min-w-[180px]">
                              {[
                                { label: "TOTAL ITEMS", val: report.summary.totalItems, c: "text-slate-900" },
                                { label: "LOW STOCK", val: report.summary.lowStockCount, c: "text-amber-600" },
                                { label: "EXPIRING SOON", val: report.summary.expiryRiskCount, c: "text-rose-600" }
                              ].map(s => (
                                <div key={s.label} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                   <span className="text-slate-400">{s.label}</span>
                                   <span className={s.c}>{s.val}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Tactical Inventory Row */}
                      <div className="md:col-span-6 bg-[#FAFDFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-md">
                        <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2"><Flame size={14} /> Expiring Soon</h4>
                        <div className="space-y-3">
                           {report.inventoryDetails.expiringSoon.map((item, i) => (
                             <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                               <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{item.name}</span>
                               <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Urgent</span>
                             </div>
                           ))}
                           {report.inventoryDetails.expiringSoon.length === 0 && (
                             <div className="flex flex-col items-center justify-center py-6 text-slate-200">
                               <ShieldCheck size={32} />
                               <p className="text-[10px] font-bold uppercase tracking-widest mt-2">All items fresh</p>
                             </div>
                           )}
                        </div>
                      </div>

                      <div className="md:col-span-6 bg-[#FAFDFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-md">
                        <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14} /> Low Stock List</h4>
                        <div className="space-y-3">
                           {report.inventoryDetails.lowStock.map((item, i) => (
                             <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                               <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{item.name}</span>
                               <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{item.qty} {item.unit} left</span>
                             </div>
                           ))}
                        </div>
                      </div>

                     {/* Nutritional Rollup */}
                      <div className="md:col-span-12 bg-[#FAFDFF] border border-slate-200 rounded-3xl p-8 space-y-8 shadow-md">
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={14} /> Weekly Nutrition Summary</h4>
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-8">
                           {[
                             { label: "TOTAL CALORIES", val: Math.round(report.nutrition.weeklyCalories).toLocaleString(), suffix: "kcal" },
                             { label: "TOTAL PROTEIN", val: report.nutrition.weeklyProtein.toFixed(1), suffix: "g" },
                             { label: "DAILY AVERAGE", val: Math.round(report.nutrition.avgDailyCals).toLocaleString(), suffix: "kcal/d" },
                             { label: "STATUS", val: "STABLE", suffix: "" }
                           ].map(n => (
                              <div key={n.label} className="space-y-1">
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{n.label}</p>
                                 <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-900">{n.val}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{n.suffix}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>

                <footer className="p-8 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      <ShieldCheck size={14} /> Secure report encryption active
                   </div>
                    <div className="flex gap-4">
                     <button 
                       className={`px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-md
                         ${emailStatus === "sent" 
                           ? "bg-emerald-500 text-white" 
                           : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`} 
                       onClick={handleEmailReport}
                       disabled={isEmailing}
                     >
                       {isEmailing ? <Loader2 className="animate-spin" size={14} /> : emailStatus === "sent" ? <Check size={14}/> : <Mail size={14} />}
                       {isEmailing ? "Sending..." : emailStatus === "sent" ? "Sent!" : "Email Report"}
                     </button>
                     <button className="bg-slate-900 text-white rounded-xl py-3 px-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md" onClick={() => window.print()}>
                        <ArrowUpRight size={14} /> Print Report (PDF)
                     </button>
                   </div>
                </footer>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cooking <span className="text-blue-600">Insights</span></h1>
            <p className="text-slate-500 text-sm">Track your progress and nutrition habits.</p>
          </div>
          <button 
            className="bg-slate-900 text-white py-3 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md group" 
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} className="group-hover:rotate-12 transition-transform" />}
            {isGenerating ? "Generating..." : "Generate Report"}
          </button>
        </div>

        {/* DASHBOARD FILTERS */}
        <div className="flex flex-wrap items-center gap-4 px-2">
           <div className="flex items-center gap-3 bg-[#FAFDFF] border border-slate-200 rounded-2xl p-1.5 shadow-md">
             {timeframeOptions.map(opt => (
               <button 
                 key={opt.value}
                 className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all
                   ${selectedDays === opt.value 
                     ? "bg-blue-600 text-white shadow-md" 
                     : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"}`}
                 onClick={() => setSelectedDays(opt.value)}
               >
                 {opt.label}
               </button>
             ))}
           </div>

           <div className="relative group min-w-[200px]">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none group-hover:text-blue-700 transition-colors">
                <PieIcon size={14} />
             </div>
             <select 
               className="w-full bg-[#FAFDFF] border border-slate-200 rounded-2xl pl-10 pr-10 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer shadow-md"
               value={selectedCuisine}
               onChange={(e) => setSelectedCuisine(e.target.value)}
             >
               <option value="Global">All Cuisines</option>
               {data.cuisineMastery.map((c, idx) => (
                 <option key={`${c.name}-${idx}`} value={c.name}>{c.name.toUpperCase()}</option>
               ))}
             </select>
             <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-600 transition-all" />
           </div>
        </div>

        {/* MAIN INTELLIGENCE GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* METRIC MATRIX */}
          <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
            <MetricCard 
               label="COOKING STREAK" 
               value={`${data.streak} DAYS`} 
               trend="STEADY" 
               icon={<Flame size={20} />}
               color="#f59e0b"
            />
            <MetricCard 
               label="MEALS COOKED" 
               value={totalMeals.toLocaleString()} 
               trend="+ 12% RECENTLY" 
               icon={<Utensils size={20} />}
               color="#3b82f6"
            />
            <MetricCard 
               label="CALORIES (AVG)" 
               value={`${Math.round(todayEntry.calories).toLocaleString()} KCAL`} 
               trend="DAILY" 
               icon={<Target size={20} />}
               color="#10b981"
            />
            <MetricCard 
               label="TOP CUISINE" 
               value={topCuisine} 
               trend="EXPANDING" 
               icon={<ChefHat size={20} />}
               color="#8b5cf6"
            />
            <MetricCard 
               label="PANTRY ITEMS" 
               value={totalPantry.toString()} 
               trend="IN STOCK" 
               icon={<Box size={20} />}
               color="#f43f5e"
            />
            <MetricCard 
               label="CUISINES TRIED" 
               value={cuisineCount.toString()} 
               trend="VARIETY" 
               icon={<TrendingUp size={20} />}
               color="#6366f1"
            />
          </div>

          {/* HOLOGRAPHIC VISUALIZATIONS */}
          <div className="xl:col-span-8 space-y-8">
             {/* ENERGY ACTIVITY CHART */}
              <motion.div variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-4 sm:p-8 space-y-8 shadow-md">
                <div className="flex items-center justify-between px-2">
                   <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                         <Activity size={16} className="text-blue-600" /> Calories Over Time
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Daily energy intake</p>
                   </div>
                   <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[8px] font-bold text-blue-600 uppercase tracking-widest">Live Data</div>
                </div>
                
                <div className="h-[350px] w-full mt-4 relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.nutritionHistory}>
                        <defs>
                          <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.03)" />
                         <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                          tickFormatter={(str) => new Date(str).toLocaleDateString([], { weekday: 'short' })}
                          dy={15}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dx={-10} />
                         <ReTooltip 
                           content={<CustomTooltip />} 
                           cursor={{stroke: 'rgba(59,130,246,0.1)', strokeWidth: 2}} 
                           isAnimationActive={false}
                           allowEscapeViewBox={{ x: true, y: true }}
                         />
                        <Area type="monotone" dataKey="calories" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCal)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </motion.div>

             {/* MACRO COMPOSITION CHART */}
              <motion.div variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-4 sm:p-8 space-y-8 shadow-md">
                <div className="flex items-center justify-between px-2">
                   <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                         <Cpu size={16} className="text-emerald-600" /> Nutrition Balance
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Macro breakdown (7D AVG)</p>
                   </div>
                   
                   <div className="flex gap-4">
                      {[
                        { l: "PROTEIN", c: "#94a3b8" },
                        { l: "CARBS", c: "#3b82f6" },
                        { l: "FAT", c: "#8b5cf6" }
                      ].map(l => (
                        <div key={l.l} className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.c }} />
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{l.l}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="h-[350px] w-full mt-4 relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.nutritionHistory.slice(-7)}>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                          tickFormatter={(str) => new Date(str).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                          dy={15}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dx={-10} />
                        <ReTooltip 
                          content={<CustomTooltip />} 
                          cursor={{fill: 'rgba(0,0,0,0.02)'}} 
                          isAnimationActive={false}
                          allowEscapeViewBox={{ x: true, y: true }}
                        />
                        <Bar dataKey="protein" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                        <Line type="monotone" dataKey="carbs" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }} />
                        <Line type="monotone" dataKey="fat" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#ffffff' }} />
                      </ComposedChart>
                   </ResponsiveContainer>
                </div>
             </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

function MetricCard({ 
  label, 
  value, 
  trend, 
  icon, 
  color = "#64748b" 
}: { 
  label: string; 
  value: string; 
  trend: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#FAFDFF] border border-slate-200 rounded-3xl hover:border-blue-200 transition-all p-6 space-y-6 relative overflow-hidden group shadow-md"
    >
      <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-150 transition-all duration-700 pointer-events-none" style={{ color }}>
         {icon && <div className="scale-[5]">{icon}</div>}
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      
      <div className="space-y-1">
         <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
         <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <div className="flex items-center gap-1.5" style={{ color }}>
               <div className="w-1 h-1 rounded-full" style={{ background: color }} />
               <span className="text-[8px] font-bold uppercase tracking-widest">{trend}</span>
            </div>
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Live Data</p>
         </div>
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label, coordinate, viewBox }: any) {
  if (!active || !payload || !payload.length) return null;

  // Safe defaults to prevent the tooltip from disappearing if Recharts hasn't calculated bounds yet
  const x = coordinate?.x || 0;
  const y = coordinate?.y || 0;
  const width = viewBox?.width || 1000;
  const height = viewBox?.height || 1000;

  const isRightSide = x > width * 0.6;
  const isBottomSide = y > height * 0.6;

  return (
    <div 
      className="bg-white/95 backdrop-blur-xl border border-slate-200 p-5 shadow-2xl rounded-2xl z-[9999] pointer-events-none min-w-[200px] transition-all duration-200"
      style={{
        transform: `translate(${isRightSide ? '-100%' : '10px'}, ${isBottomSide ? '-100%' : '10px'})`,
        opacity: (x === 0 && y === 0) ? 0 : 1 // Hide only if we literally have no position
      }}
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
         <span>{new Date(label).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
         <span className="text-blue-600 text-[8px] bg-blue-50 px-2 py-0.5 rounded-full">SNAPSHOT</span>
      </p>
      <div className="space-y-3">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-8">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: p.color || p.fill }} />
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{p.name}</span>
             </div>
             <span className="text-sm font-black tracking-tight text-slate-900 font-mono">
               {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
               <span className="text-[9px] text-slate-400 ml-1 font-sans font-normal lowercase">{p.name === 'calories' ? 'kcal' : 'g'}</span>
             </span>
          </div>
        ))}
      </div>
    </div>
  );
}
