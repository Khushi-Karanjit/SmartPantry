import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Plus, ArrowRight, Database, Sparkles } from "lucide-react";
import { searchIngredientsApi, type Ingredient } from "../api/api";
import AddCustomIngredientModal from "./AddCustomIngredientModal";

export default function IngredientSearchSelect({
  category,
  value,
  onChange,
}: {
  category: string;
  value: Ingredient | null;
  onChange: (ingredient: Ingredient | null) => void;
}) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchIngredientsApi({ q: query, category: category === "All" ? "" : category });
        setResults(res.ingredients || []);
        setOpen(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, category]);

  const selectIngredient = (ing: Ingredient) => {
    setQuery(""); // Clear search after selection to allow multiple selections in many contexts
    setOpen(false);
    setResults([]);
    onChange(ing);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* PREMIUM SEARCH INPUT */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ingredients..."
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="w-full bg-[#FAFDFF] border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm"
        />

        {query && (
          <button 
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* SEARCH RESULTS DROPDOWN */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute z-[100] left-0 right-0 mt-3 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-2xl shadow-blue-900/10 overflow-hidden max-h-[400px] flex flex-col"
          >
            <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
              {results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => selectIngredient(item)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-50/50 group transition-all text-left mb-1 last:mb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <Database size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors capitalize">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                           <span className="text-[10px] text-slate-200">•</span>
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${item.isCustom ? 'text-amber-500' : 'text-blue-500'}`}>
                             {item.isCustom ? 'Custom' : 'Official'}
                           </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))
              ) : !loading && (
                <div className="p-8 text-center space-y-3">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto">
                     <Search size={24} />
                   </div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching ingredients</p>
                </div>
              )}
            </div>

            {/* ADD CUSTOM CALL TO ACTION */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
               <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                      <Plus size={16} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900">Cant find your ingredient?</p>
                        <p className="text-[10px] font-medium text-slate-500">Create a custom master entry</p>
                    </div>
                  </div>
                  <Sparkles size={16} className="text-amber-400 animate-pulse" />
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddCustomIngredientModal
        open={showModal}
        name={query}
        category={category}
        onClose={() => setShowModal(false)}
        onCreated={(ingredient) => {
          setShowModal(false);
          selectIngredient(ingredient);
        }}
      />
    </div>
  );
}
