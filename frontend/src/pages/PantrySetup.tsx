import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { 
    Leaf, 
    Utensils, 
    HeartPulse,
    Pizza,
    Activity,
    Layers,
    Cpu,
    Zap,
    ShieldCheck,
    Terminal,
    Database,
    Binary,
    ArrowRight
} from "lucide-react";

type PresetItem = {
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
};

type Preset = {
  _id?: string;
  key: string;
  title: string;
  description?: string;
  items: PresetItem[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function getIconByKey(key: string) {
  switch (key) {
    case "student":
      return Utensils;
    case "nepali":
      return Leaf;
    case "healthy":
      return HeartPulse;
    case "italian":
      return Pizza;
    default:
      return Utensils;
  }
}

export default function PantrySetup() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [initializing, setInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login again to continue.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/pantry/presets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.message || "Failed to load sets.");
          setLoading(false);
          return;
        }

        setPresets(data.presets || []);
      } catch {
        setError("Network error while loading sets.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const initializePantry = async () => {
    try {
      setError("");

      if (!selectedKey) {
        setError("Please select a starter set first.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login again to continue.");
        return;
      }

      setInitializing(true);

      const res = await fetch(`${API_BASE}/api/pantry/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ presetKey: selectedKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to set up your pantry.");
        return;
      }

      setError(`Successfully added ${data.count || 0} items to your pantry.`);
    } catch {
      setError("Network error while setting up your pantry.");
    } finally {
      setInitializing(false);
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

  if (loading) return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
            <Activity className="animate-spin text-blue-600" size={48} />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading setup...</p>
        </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-32">
           
           {/* HEADER SECTION */}
           <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
              <div className="space-y-1">
                 <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pantry <span className="text-blue-600">Setup</span></h1>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 border border-slate-200 px-3 py-1 rounded-full w-fit">
                    <Layers size={12} className="text-blue-600" />
                    Select a starter set
                 </div>
              </div>
               <div className="flex items-center gap-4">
                 <div className="bg-[#FAFDFF] border border-slate-200 px-6 py-3 rounded-xl shadow-md text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} /> Starter sets: {presets.length}
                 </div>
              </div>
           </motion.div>

            {error && (
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Terminal size={16} /> {error}
             </motion.div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {presets.map((p: Preset) => {
                const Icon = getIconByKey(p.key);
                const isSelected = selectedKey === p.key;
                const preview = (p.items || []).slice(0, 4);

                return (
                   <motion.div
                    variants={item}
                    key={p.key}
                    onClick={() => setSelectedKey(p.key)}
                    className={`bg-white border rounded-3xl p-0 overflow-hidden cursor-pointer transition-all duration-300 relative shadow-md ${isSelected ? 'border-blue-600 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-200'}`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 text-blue-600">
                         <Zap size={16} fill="currentColor" />
                      </div>
                    )}

                     <div className="p-8 space-y-6">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                          <Icon size={24} />
                       </div>

                        <div className="space-y-1">
                           <h3 className={`text-sm font-bold uppercase tracking-widest transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>{p.title}</h3>
                           <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                           {preview.map((item: PresetItem) => (
                              <span key={item.name} className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                 {item.name}
                              </span>
                           ))}
                           {p.items.length > 4 && (
                              <span className="px-2 py-1 rounded text-[8px] font-bold bg-blue-50 text-blue-600 uppercase tracking-widest">
                                 +{p.items.length - 4} MORE
                              </span>
                           )}
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">CONTENTS</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.items.length} items</span>
                           </div>
                           <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                              {isSelected ? 'Selected' : 'Select'} <ArrowRight size={10} />
                           </div>
                        </div>
                    </div>
                  </motion.div>
                );
              })}
           </div>

            {/* ACTIVATION CORE */}
            <motion.div variants={item} className="bg-[#FAFDFF] border border-slate-200 rounded-[2.5rem] p-12 overflow-hidden relative shadow-md">
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Cpu size={120} className="text-blue-600" />
               </div>

               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative z-10">
                  <div className="space-y-4 max-w-xl">
                     <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <Binary size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Ready to start?</h3>
                        <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">
                           Setting up your pantry will add these basic ingredients to your kitchen. 
                           You can always add more or remove items later from your inventory dashboard.
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-6">
                     <button 
                        className="bg-slate-900 text-white py-6 px-16 rounded-3xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={initializePantry}
                        disabled={initializing || !selectedKey}
                     >
                        {initializing ? <Activity className="animate-spin" size={18} /> : (selectedKey ? <Zap size={18} className="group-hover:rotate-12 transition-transform" /> : <ShieldCheck size={18} className="opacity-40" />)}
                        {initializing ? "SETTING UP..." : (selectedKey ? "Setup my Pantry" : "Select a set")}
                     </button>
                  </div>
               </div>

               <div className="mt-12 flex flex-wrap gap-12 p-6 rounded-3xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Connection: Stable</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Security: Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-slate-300" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System: Online</span>
                  </div>
               </div>
           </motion.div>
        </motion.div>
    </DashboardLayout>
  );
}
