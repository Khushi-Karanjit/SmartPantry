import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Database, Tag, Calendar, Plus, Loader2, Sparkles, Hash, Layers } from "lucide-react";
import { createCustomIngredientApi, getCategoriesApi, type Ingredient, type Category, PANTRY_UNITS } from "../api/api";

export default function AddCustomIngredientModal({
  open,
  name,
  category,
  onClose,
  onCreated,
}: {
  open: boolean;
  name: string;
  category: string;
  onClose: () => void;
  onCreated: (ingredient: Ingredient) => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [defaultUnit, setDefaultUnit] = useState("pcs");
  const [shelfLifeDays, setShelfLifeDays] = useState(0);
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category selection state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(category);

  useEffect(() => {
    async function load() {
      try {
        const res = await getCategoriesApi();
        setCategories(res.categories || []);
        
        // If initial category is 'All' or empty, pick the first one from list if available
        if (category.toLowerCase() === "all" || !category) {
          if (res.categories?.length > 0) setSelectedCategory(res.categories[0].name);
        } else {
          setSelectedCategory(category);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    
    if (open) {
      load();
      setDraftName(name);
      setDefaultUnit("pcs");
      setShelfLifeDays(14); 
      setKeywords("");
      setError(null);
    }
  }, [name, open, category]);

  const tooShort = draftName.trim().length < 2;
  const badShelf = shelfLifeDays < 0 || shelfLifeDays > 3650;

  async function submit() {
    if (tooShort || badShelf) return;
    try {
      setSaving(true);
      setError(null);
      const res = await createCustomIngredientApi({
        name: draftName.trim(),
        category: selectedCategory,
        defaultUnit,
        shelfLifeDays,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      });
      onCreated(res.ingredient);
    } catch (e: any) {
      setError(e?.message || "Failed to create ingredient");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="modal-content relative group"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Create Ingredient</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Custom Master Record</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <X size={14} className="shrink-0" /> {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Ingredient Name */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} className="text-blue-500" /> Ingredient Name *
                  </label>
                  <input 
                    autoFocus
                    value={draftName} 
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="e.g. Organic Basil Leaves"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Layers size={12} className="text-blue-500" /> Classification Category *
                    </label>
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Hash size={12} className="text-indigo-500" /> Default Unit
                    </label>
                    <select 
                      value={defaultUnit} 
                      onChange={(e) => setDefaultUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50 transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      {PANTRY_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  {/* Shelf Life */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} className="text-purple-500" /> Shelf Life (Days)
                    </label>
                    <input 
                      type="number"
                      min={0}
                      value={shelfLifeDays}
                      onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50/50 transition-all shadow-sm font-mono"
                    />
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-amber-500" /> Search Keywords
                  </label>
                  <input 
                    value={keywords} 
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="tomato, tamatar, cherry tomato..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50/50 transition-all shadow-sm placeholder:text-slate-300"
                  />
                  <p className="text-[8px] font-medium text-slate-400 uppercase tracking-tight pl-1 italic">Separated by commas to improve AI logic</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-10">
                <button 
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={submit}
                  disabled={saving || tooShort || badShelf}
                  className="flex-[2] btn-futuristic flex items-center justify-center gap-3 shadow-blue-200 shadow-lg"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} className="rotate-0 group-hover:rotate-90 transition-transform" />
                  )}
                  <span className="text-xs uppercase font-bold tracking-widest">
                    {saving ? "Creating..." : "Add to Library"}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
