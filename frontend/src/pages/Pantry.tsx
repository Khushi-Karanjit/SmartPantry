import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import IngredientSearchSelect from "../components/IngredientSearchSelect";
import Skeleton from "../components/Skeleton";
import {
  Plus,
  Search,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Loader2,
  RotateCcw,
  Eraser,
  Calendar,
  Box,
  Layers,
  Utensils,
  Flame,
  Mountain,
  Coffee,
  Dumbbell,
  Cookie,
  Soup,
  Beef,
  Droplets
} from "lucide-react";
import {
  getPantryItemsApi,
  addPantryItemApi,
  updatePantryItemApi,
  deletePantryItemApi,
  getCategoriesApi,
  getPresetsApi,
  cleanupExpiredPantryApi,
  restockPantryItemApi,
  type PantryItem,
  type Category,
  type Ingredient,
  type PaginationMeta,
  type PantryPreset,
  PANTRY_UNITS
} from "../api/api";

function daysUntil(dateIso: string) {
  const now = new Date();
  const d = new Date(dateIso);
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function statusOf(item: PantryItem) {
  if (!item.expiryDate) return { label: "FRESH", kind: "fresh", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" };
  const d = daysUntil(item.expiryDate);
  if (d < 0) return { label: "EXPIRED", kind: "expired", cls: "bg-red-50 text-red-600 border-red-100" };
  if (d <= 2) return { label: "URGENT", kind: "urgent", cls: "bg-amber-50 text-amber-600 border-amber-100" };
  return { label: "FRESH", kind: "fresh", cls: "bg-blue-50 text-blue-600 border-blue-100" };
}
function getIconByKey(key: string) {
  switch (key) {
    case "bakery": return Cookie;
    case "spices": return Flame;
    case "himalayan": return Mountain;
    case "fusion": return Utensils;
    case "barista": return Coffee;
    case "italian": return Soup;
    case "gym": return Dumbbell;
    case "nepali-staples": return Droplets; // Using Droplets for Mustard Oil/Oils staple
    default: return Utensils;
  }
}

export default function Pantry() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [presets, setPresets] = useState<PantryPreset[]>([]);

  const [tab, setTab] = useState<string>("all");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  type CartItem = { ingredient: Ingredient; quantity: number; unit: string };
  const [addCart, setAddCart] = useState<CartItem[]>([]);

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    category: "",
    ingredient: null as Ingredient | null,
    quantity: 1,
    unit: "",
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");

  // Restock quantity modal
  const [restockModal, setRestockModal] = useState<{ open: boolean; id: string; name: string; currentQty: number; unit: string } | null>(null);
  const [restockQty, setRestockQty] = useState(1);

  async function fetchCategories() {
    try {
      setError("");
      const res = await getCategoriesApi();
      setCategories(res.categories || []);
    } catch (e: any) {
      setError(e?.message || "Failed to sync categories.");
    }
  }

  async function fetchItems(pageToFetch = page) {
    try {
      setLoading(true);
      setError("");
      const res = await getPantryItemsApi({
        page: pageToFetch,
        search: q,
        category,
        tab,
        status
      });
      setItems(res.items || []);
      setPagination(res.pagination);
    } catch (e: any) {
      setError(e?.message || "Something went wrong while syncing your kitchen.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPresets() {
    try {
      const res = await getPresetsApi();
      setPresets(res.presets || []);
    } catch (e: any) {
      console.error("Failed to fetch presets:", e);
    }
  }

  useEffect(() => {
    fetchCategories();
    fetchPresets();
  }, []);

  useEffect(() => {
    setPage(1);
    setStatus("");
    fetchItems(1);
  }, [q, category, tab]);

  useEffect(() => {
    fetchItems(page);
  }, [page, status]);

  function addToCart(ingredient: Ingredient) {
    // Prevent duplicate
    if (addCart.find(c => c.ingredient._id === ingredient._id)) return;
    setAddCart(prev => [...prev, { ingredient, quantity: 1, unit: ingredient.defaultUnit || "pcs" }]);
  }

  function removeFromCart(idx: number) {
    setAddCart(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCartItem(idx: number, field: "quantity" | "unit", value: string | number) {
    setAddCart(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const filtered = items;

  function openEditModal(it: PantryItem) {
    setEditId(it._id);
    setEditForm({
      category: it.category || addForm.category || "",
      ingredient: {
        _id: it.ingredientId ?? "",
        name: it.name,
        category: it.category ?? "",
        defaultUnit: it.unit ?? "",
        shelfLifeDays: it.shelfLifeDays || 0,
        isCustom: false,
      },
      quantity: it.quantity ?? 1,
      unit: it.unit || "",
    });
    setOpenEdit(true);
  }

  async function addAllItems() {
    if (addCart.length === 0) { setError("Please add at least one item."); return; }
    try {
      setSaving(true);
      const messages: string[] = [];
      for (const cartItem of addCart) {
        const res = await addPantryItemApi({
          ingredientId: cartItem.ingredient._id,
          quantity: Number(cartItem.quantity) || 1,
          unit: cartItem.unit || cartItem.ingredient.defaultUnit || "pcs",
          presetKey: tab === "all" ? undefined : tab
        });
        if (res.restockStatus === 'cleared') messages.push(`${cartItem.ingredient.name}: expired stock discarded.`);
        else if (res.restockStatus === 'urgent_merge') messages.push(`${cartItem.ingredient.name}: use older stock first!`);
      }
      if (messages.length > 0) {
        setInfoMessage(messages.join(" · "));
        setTimeout(() => setInfoMessage(""), 8000);
      }
      setOpenAdd(false);
      setAddCart([]);
      await fetchItems(1);
    } catch (e: any) {
      setError(e?.message || "Addition failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    try {
      setSaving(true);
      if (!editId || !editForm.ingredient) return;
      await updatePantryItemApi(editId, {
        ingredientId: editForm.ingredient._id,
        quantity: Number(editForm.quantity) || 1,
        unit: editForm.unit || editForm.ingredient.defaultUnit || "pcs",
      });
      setOpenEdit(false);
      setEditId("");
      await fetchItems(page);
    } catch (e: any) {
      setError(e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    try {
      setDeletingId(id);
      const ok = confirm("Remove this item from your kitchen?");
      if (!ok) return;
      await deletePantryItemApi(id);
      await fetchItems(page);
    } catch (e: any) {
      setError(e?.message || "Deletion error.");
    } finally {
      setDeletingId("");
    }
  }

  async function cleanupAll() {
    try {
      const expiredCount = items.filter(i => statusOf(i).kind === 'expired').length;
      if (expiredCount === 0) return;
      const ok = confirm(`Delete all ${expiredCount} expired items?`);
      if (!ok) return;
      setLoading(true);
      await cleanupExpiredPantryApi();
      await fetchItems(1);
    } catch (e: any) {
      setError(e?.message || "Cleanup failed.");
    } finally {
      setLoading(false);
    }
  }

  function openRestockModal(it: PantryItem) {
    setRestockModal({ open: true, id: it._id, name: it.name, currentQty: it.quantity ?? 0, unit: it.unit || "pcs" });
    setRestockQty(1);
  }

  async function confirmRestock() {
    if (!restockModal) return;
    try {
      setSaving(true);
      const res = await restockPantryItemApi(restockModal.id, restockQty);
      if (res.restockStatus === 'cleared') {
        setInfoMessage(`Safety Check: Expired stock of ${restockModal.name} was discarded. Fresh ${restockQty} ${restockModal.unit} added.`);
      } else if (res.restockStatus === 'urgent_merge') {
        setInfoMessage(`Restocked ${restockModal.name}. Please use your older stock first!`);
      } else {
        setInfoMessage(`${restockModal.name} restocked — quantity updated to ${(restockModal.currentQty) + restockQty} ${restockModal.unit}.`);
      }
      setRestockModal(null);
      await fetchItems(page);
      setTimeout(() => setInfoMessage(""), 6000);
    } catch (e: any) {
      setError(e?.message || "Restock failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="space-y-8 pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">My Kitchen <span className="text-blue-600">Stock</span></h2>
            <p className="text-slate-500 text-sm">Overview of all your food items.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
               onClick={cleanupAll}
               disabled={loading || items.filter(i => statusOf(i).kind === 'expired').length === 0}
               className="flex items-center gap-2 px-5 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-20"
            >
               <Eraser size={16} /> Clean Up
            </button>
            <button
              onClick={() => navigate('/recipe-suggester')}
              className="btn-ghost-futuristic text-xs uppercase tracking-widest flex items-center gap-2 py-3"
            >
              <Sparkles size={16} /> Find Recipes
            </button>
            <button
              onClick={() => {
                if (categories.length === 0) {
                  setError('Warning: Categories are missing.');
                  return;
                }
                setOpenAdd(true);
              }}
              className="btn-futuristic text-xs uppercase tracking-widest flex items-center gap-2 py-3 shadow-lg"
            >
              <Plus size={16} /> Add Food Item
            </button>
          </div>
        </div>

        <AnimatePresence>
          {infoMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="px-2"
            >
              <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-5 flex items-center justify-between shadow-lg shadow-blue-500/5 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:rotate-12 transition-transform">
                    <AlertCircle size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">Kitchen Intelligence</p>
                    <p className="text-sm font-medium text-blue-600">{infoMessage}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInfoMessage("")}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-blue-300 hover:text-blue-600 hover:bg-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HIGH-TECH TABS (DYNAMIC) */}
        <div className="flex items-center gap-2 px-2 overflow-x-auto pb-4 custom-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setTab("all")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border
              ${tab === "all" 
                ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }
            `}
          >
            <Layers size={14}/> GLOBAL KITCHEN
          </button>

          {presets.map((p) => {
             const Icon = getIconByKey(p.key);
             return (
              <button 
                key={p.key}
                onClick={() => setTab(p.key)}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border
                  ${tab === p.key 
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]" 
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon size={14}/> {p.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()}
              </button>
             );
          })}
        </div>

        {/* URGENT TELEMETRY BANNERS */}
        <AnimatePresence>
          <div className="space-y-4 px-2">
            {pagination?.expiringSoonCount ? (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="glass-card bg-amber-50 border-amber-100 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-700 uppercase tracking-widest">Expiration Warning</div>
                      <p className="text-xs text-slate-600 font-medium">{pagination.expiringSoonCount} items are expiring within 48 hours.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setStatus("expiring"); setPage(1); }}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors shadow-md"
                    >
                      View Urgent Items
                    </button>
                    {status === "expiring" && (
                      <button 
                        onClick={() => setStatus("")}
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}

            {pagination?.expiredCount ? (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="glass-card bg-red-50 border-red-100 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                      <Trash2 size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-red-700 uppercase tracking-widest">Critical Alert</div>
                      <p className="text-xs text-slate-600 font-medium">{pagination.expiredCount} items have reached their expiration limit.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setStatus("expired"); setPage(1); }}
                      className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md"
                    >
                      View Expired Items
                    </button>
                    <button 
                      onClick={cleanupAll}
                      className="px-5 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
                    >
                      Purge All
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </AnimatePresence>

        {/* CONTROL SYSTEMS */}
        <div className="bg-white p-4 flex flex-col md:flex-row items-center gap-4 border border-slate-200 rounded-2xl shadow-md">
          <div className="flex-1 relative group w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Search by food name..." 
              className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium shadow-md"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-hidden">
                {[
                  { id: "", label: "ALL", icon: <Layers size={14}/> },
                  { id: "fresh", label: "FRESH", icon: <Sparkles size={14}/>, count: pagination?.freshCount },
                  { id: "expiring", label: "SOON", icon: <AlertCircle size={14}/>, count: pagination?.expiringSoonCount },
                  { id: "expired", label: "EXPIRED", icon: <X size={14}/>, count: pagination?.expiredCount }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStatus(s.id); setPage(1); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-tighter transition-all relative
                      ${status === s.id 
                        ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" 
                        : "text-slate-500 hover:text-slate-900"
                      }
                    `}
                  >
                    {s.icon} <span>{s.label}</span>
                    {s.count ? (
                       <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] border ${status === s.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                          {s.count}
                       </span>
                    ) : null}
                  </button>
                ))}
             </div>
             
             <div className="relative flex-1 md:w-48 group">
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#FAFDFF] border border-slate-200 rounded-xl py-3.5 pl-4 pr-10 text-sm text-slate-900 appearance-none focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer font-bold shadow-md"
                >
                  {['All Categories', ...categories.map((c) => c.name)].map((c) => (
                    <option key={c} value={c === 'All Categories' ? 'All' : c} className="bg-white">{c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-slate-900 transition-colors" />
             </div>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest px-6 mx-2">
            Error: {error}
          </motion.div>
        )}

        {/* DATA GRID / TABLE */}
        <div className="glass-card overflow-hidden p-0 border-white/5">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Food Name</th>
                  <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
                  <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiration</th>
                  <th className="text-left px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-right px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="wait">
                  {loading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td className="px-8 py-5"><Skeleton width="140px" height="1.2rem" borderRadius="10px" /></td>
                        <td className="px-8 py-5"><Skeleton width="60px" height="1.2rem" borderRadius="10px" /></td>
                        <td className="px-8 py-5"><Skeleton width="80px" height="1.8rem" borderRadius="99px" /></td>
                        <td className="px-8 py-5"><Skeleton width="100px" height="1.2rem" borderRadius="10px" /></td>
                        <td className="px-8 py-5"><Skeleton width="80px" height="1.8rem" borderRadius="99px" /></td>
                        <td className="px-8 py-5 text-right"><Skeleton width="100px" height="2rem" borderRadius="10px" /></td>
                      </tr>
                    ))
                  ) : filtered.length > 0 ? (
                    filtered.map((it, idx) => {
                      const st = statusOf(it);
                      return (
                        <motion.tr 
                          key={it._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="group hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                                <span className="font-bold text-slate-800 tracking-tight">{it.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{it._id.slice(-8)}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-sm font-bold text-slate-700">{it.quantity} <span className="text-xs font-medium text-slate-400">{it.unit || "pcs"}</span></span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{it.category || "General"}</span>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-2 text-slate-500">
                                <Calendar size={14} className="text-slate-300" />
                                <span className="text-sm font-medium">{it.expiryDate ? it.expiryDate.slice(0, 10) : "No date"}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-4 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${st.cls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openRestockModal(it)} 
                                className="p-3 rounded-xl bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-all shadow-md"
                                title="Restock — add more quantity"
                              >
                                <RotateCcw size={16} />
                              </button>
                              <button 
                                onClick={() => openEditModal(it)} 
                                className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all shadow-md"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => deleteItem(it._id)}
                                className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all shadow-md"
                                title="Delete"
                                disabled={deletingId === it._id}
                              >
                                {deletingId === it._id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-4">
                           <Eraser size={48} className="text-slate-200" />
                           <p className="text-xs font-bold uppercase tracking-widest">No food items found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION TELEPORT */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 pt-4">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="btn-ghost-futuristic py-2 px-6 flex items-center gap-2 transform disabled:opacity-20"
            >
              Previous Sector
            </button>
            <div className="flex flex-col items-center text-center">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page</span>
               <span className="text-xl font-bold text-slate-800">{pagination.currentPage} of {pagination.totalPages}</span>
            </div>
            <button 
              disabled={page === pagination.totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn-ghost-futuristic py-2 px-6 flex items-center gap-2 transform disabled:opacity-20"
            >
              Next Sector
            </button>
          </div>
        )}

        {/* RESTOCK QUANTITY MODAL */}
        <AnimatePresence>
          {restockModal?.open && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setRestockModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 capitalize">{restockModal.name.toLowerCase()}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Restock Item</p>
                  </div>
                  <button onClick={() => setRestockModal(null)} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                    <X size={18} />
                  </button>
                </div>

                {/* Current stock info */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stock</p>
                    <p className="text-2xl font-bold text-slate-800">{restockModal.currentQty} <span className="text-sm font-medium text-slate-400">{restockModal.unit}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">After Restock</p>
                    <p className="text-2xl font-bold text-green-600">{restockModal.currentQty + restockQty} <span className="text-sm font-medium text-slate-400">{restockModal.unit}</span></p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Quantity to Add</label>
                  <input
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-slate-900 text-center text-xl font-bold focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-50 transition-all"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 btn-ghost-futuristic text-sm py-4" onClick={() => setRestockModal(null)}>Cancel</button>
                  <button
                    className="flex-1 py-4 rounded-2xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                    onClick={confirmRestock}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : `Add ${restockQty} ${restockModal.unit}`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HIGH-TECH MODALS */}
        <AnimatePresence>
          {(openAdd || openEdit) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => { setOpenAdd(false); setOpenEdit(false); setAddCart([]); }}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                      {openAdd ? "Add Items" : "Edit Item"}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Kitchen Manager</p>
                  </div>
                  <button onClick={() => { setOpenAdd(false); setOpenEdit(false); setAddCart([]); }} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                    <X size={20} />
                  </button>
                </div>

                {openAdd ? (
                  /* ── MULTI-ITEM ADD CART ── */
                  <>
                    {/* Search */}
                    <div className="flex-shrink-0 space-y-1 mb-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Search & Add Ingredients</p>
                      <IngredientSearchSelect
                        category=""
                        value={null}
                        onChange={(ingredient) => { if (ingredient) addToCart(ingredient); }}
                      />
                    </div>

                    {/* Cart list */}
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[60px] mb-4">
                      {addCart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No items yet</p>
                          <p className="text-[11px] text-slate-300 mt-1">Search above to add ingredients</p>
                        </div>
                      ) : (
                        addCart.map((cartItem, idx) => (
                          <div key={cartItem.ingredient._id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 capitalize truncate">{cartItem.ingredient.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cartItem.ingredient.category}</p>
                            </div>
                            <input
                              type="number"
                              min={1}
                              value={cartItem.quantity}
                              onChange={(e) => updateCartItem(idx, "quantity", Number(e.target.value))}
                              className="w-16 text-center bg-white border border-slate-200 rounded-xl py-2 px-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                            />
                            <select
                              value={cartItem.unit}
                              onChange={(e) => updateCartItem(idx, "unit", e.target.value)}
                              className="w-20 bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 appearance-none cursor-pointer"
                            >
                              {PANTRY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-4 flex-shrink-0">
                      <button className="flex-1 btn-ghost-futuristic text-sm py-4" onClick={() => { setOpenAdd(false); setAddCart([]); }}>Cancel</button>
                      <button
                        className="flex-1 btn-futuristic text-sm py-4 shadow-blue-200"
                        onClick={addAllItems}
                        disabled={saving || addCart.length === 0}
                      >
                        {saving ? "Saving..." : `Add ${addCart.length > 0 ? addCart.length + " " : ""}Item${addCart.length !== 1 ? "s" : ""}`}
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── SINGLE ITEM EDIT ── */
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Category</label>
                      <div className="relative group">
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value, ingredient: null, unit: "" })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-slate-900 appearance-none focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold"
                        >
                          {categories.map((c) => (
                            <option key={c._id} value={c.name} className="bg-white">{c.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Food Name</label>
                      <IngredientSearchSelect
                        category={editForm.category}
                        value={editForm.ingredient}
                        onChange={(ingredient) =>
                          setEditForm((p) => ({
                            ...p,
                            ingredient,
                            category: ingredient ? ingredient.category : p.category,
                            unit: ingredient ? ingredient.defaultUnit || p.unit : ""
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                        <input
                          type="number"
                          min={0}
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Unit</label>
                        <select
                          value={editForm.unit}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold appearance-none cursor-pointer"
                        >
                          {PANTRY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 btn-ghost-futuristic text-sm py-4" onClick={() => setOpenEdit(false)}>Cancel</button>
                      <button className="flex-1 btn-futuristic text-sm py-4 shadow-blue-200" onClick={saveEdit} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
