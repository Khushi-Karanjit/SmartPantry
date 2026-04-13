import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { 
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
    ArrowRight,
    Mountain,
    Coffee,
    Dumbbell,
    Flame,
    Cookie,
    Soup,
    CheckCircle2,
    Circle,
    X,
    Info
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
    case "bakery": return Cookie;
    case "spices": return Flame;
    case "himalayan": return Mountain;
    case "fusion": return Utensils;
    case "barista": return Coffee;
    case "italian": return Soup;
    case "gym": return Dumbbell;
    default: return Utensils;
  }
}

function getGradientByKey(key: string) {
  switch (key) {
    case "bakery": return "from-orange-500/20 to-amber-500/20";
    case "spices": return "from-red-500/20 to-orange-500/20";
    case "himalayan": return "from-indigo-500/20 to-slate-500/20";
    case "fusion": return "from-emerald-500/20 to-teal-500/20";
    case "barista": return "from-amber-900/20 to-orange-900/10";
    case "italian": return "from-emerald-600/20 to-rose-600/20";
    case "gym": return "from-blue-600/20 to-indigo-600/20";
    default: return "from-slate-500/10 to-slate-500/5";
  }
}

export default function PantrySetup() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [initializing, setInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Custom Selection State
  const [showModal, setShowModal] = useState(false);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/pantry/presets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPresets(data.presets || []);
    } catch {
      setError("Network error while loading sets.");
    } finally {
      setLoading(false);
    }
  };

  const openPreview = (p: Preset) => {
    setActivePreset(p);
    setSelectedKey(p.key);
    setSelectedItems(new Set(p.items.map(i => i.name)));
    setShowModal(true);
  };

  const toggleItem = (name: string) => {
    const next = new Set(selectedItems);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedItems(next);
  };

  const initializePantry = async () => {
    if (!selectedKey) return;
    
    try {
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      if (!token) return;

      setInitializing(true);
      
      const res = await fetch(`${API_BASE}/api/pantry/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          presetKey: selectedKey,
          selectedNames: Array.from(selectedItems)
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully added ${data.count || 0} items to your kitchen!`);
        setShowModal(false);
      } else {
        setError(data?.message || "Failed to set up your pantry.");
      }
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
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-32 max-w-7xl mx-auto">
           
           {/* HEADER */}
           <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
              <div className="space-y-2">
                 <h1 className="text-4xl font-black tracking-tight text-slate-900">Elite Starter <span className="text-blue-600">Kits</span></h1>
                 <p className="text-slate-500 font-medium text-sm">Professional foundations for every culinary style.</p>
              </div>
               <div className="flex items-center gap-4">
                 <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} className="text-blue-600" /> Presets: {presets.length}
                 </div>
              </div>
           </motion.div>

            {(error || success) && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }} 
               animate={{ opacity: 1, y: 0 }} 
               className={`p-5 rounded-2xl border text-xs font-bold uppercase tracking-widest flex items-center gap-3 shadow-sm ${success ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
             >
                {success ? <CheckCircle2 size={20} /> : <Terminal size={18} />}
                {success || error}
             </motion.div>
           )}

           {/* PRESET GRID */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {presets.map((p: Preset) => {
                const Icon = getIconByKey(p.key);
                const isSelected = selectedKey === p.key;
                const gradient = getGradientByKey(p.key);

                return (
                   <motion.div
                    variants={item}
                    key={p.key}
                    whileHover={{ y: -5 }}
                    className={`group bg-white/60 backdrop-blur-xl border-2 rounded-[2rem] p-0 overflow-hidden cursor-pointer transition-all duration-300 relative shadow-xl hover:shadow-2xl ${isSelected ? 'border-blue-600 ring-4 ring-blue-50/50' : 'border-slate-100'}`}
                    onClick={() => openPreview(p)}
                  >
                     <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
                     
                     <div className="p-8 space-y-6 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${isSelected ? 'bg-blue-600 text-white shadow-blue-400/20 rotate-6' : 'bg-white/80 text-slate-400 group-hover:scale-110 shadow-slate-100'}`}>
                           <Icon size={28} />
                        </div>

                        <div className="space-y-1">
                           <h3 className={`text-base font-bold uppercase tracking-wide transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-900 group-hover:text-blue-600'}`}>
                             {p.title}
                           </h3>
                           <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed opacity-80">{p.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 min-h-[50px] content-start">
                           {p.items.slice(0, 3).map((it) => (
                              <span key={it.name} className="px-2 py-0.5 rounded-lg bg-white/40 border border-white/60 text-[8px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur-sm">
                                 {it.name}
                              </span>
                           ))}
                           {p.items.length > 3 && (
                             <span className="px-2 py-0.5 rounded-lg bg-blue-500 text-white text-[8px] font-bold uppercase tracking-widest shadow-sm">
                               +{p.items.length - 3} Items
                             </span>
                           )}
                        </div>

                        <div className="pt-6 border-t border-slate-900/5 flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Premium Foundation</span>
                              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{p.items.length} Elements</span>
                           </div>
                           <motion.div 
                             animate={isSelected ? { x: [0, 5, 0] } : {}}
                             transition={{ repeat: Infinity, duration: 2 }}
                             className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}
                           >
                              {isSelected ? 'Ready' : 'Preview'} <ArrowRight size={14} />
                           </motion.div>
                        </div>
                     </div>
                  </motion.div>
                );
              })}
           </div>

           {/* FOOTER ACTION */}
            {!selectedKey && (
              <motion.div variants={item} className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 opacity-50 grayscale">
                 <Layers size={48} className="text-slate-300" />
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Select a kit to begin customization</p>
              </motion.div>
            )}
        </motion.div>

        {/* CUSTOM SELECTION MODAL */}
        <AnimatePresence>
           {showModal && activePreset && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                 <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                   onClick={() => setShowModal(false)}
                 />
                 
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9, y: 20 }}
                   className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                 >
                    <div className="p-10 space-y-8">
                       <header className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                             <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                {(() => {
                                  const Icon = getIconByKey(activePreset.key);
                                  return <Icon size={32} />;
                                })()}
                             </div>
                             <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{activePreset.title}</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventory Checklist</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => setShowModal(false)}
                            className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors"
                          >
                             <X size={20} />
                          </button>
                       </header>

                       <section className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                          <div className="flex items-center gap-3 mb-6 px-2">
                             <Info size={16} className="text-blue-500" />
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uncheck any items you don't have in your kitchen.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                             {activePreset.items.map((it) => {
                                const isChecked = selectedItems.has(it.name);
                                return (
                                   <button
                                     key={it.name}
                                     onClick={() => toggleItem(it.name)}
                                     className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isChecked ? 'bg-white border-blue-100 shadow-sm' : 'bg-slate-100/50 border-transparent opacity-50'}`}
                                   >
                                      <div className="flex items-center gap-3">
                                         {isChecked ? <CheckCircle2 className="text-blue-600" size={18} /> : <Circle className="text-slate-300" size={18} />}
                                         <span className={`text-[11px] font-bold uppercase tracking-wide ${isChecked ? 'text-slate-700' : 'text-slate-400'}`}>
                                           {it.name}
                                         </span>
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-400">{it.quantity} {it.unit}</span>
                                   </button>
                                );
                             })}
                          </div>
                       </section>

                       <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total selected</span>
                             <span className="text-lg font-black text-slate-900">{selectedItems.size} <span className="text-xs text-blue-600">/ {activePreset.items.length}</span></span>
                          </div>
                          
                          <button 
                             disabled={initializing || selectedItems.size === 0}
                             onClick={initializePantry}
                             className="w-full sm:w-auto bg-slate-900 text-white py-5 px-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                             {initializing ? <Activity className="animate-spin" size={18} /> : <Zap size={18} />}
                             {initializing ? "CALIBRATING..." : "Initialize My Kitchen"}
                          </button>
                       </footer>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
    </DashboardLayout>
  );
}
