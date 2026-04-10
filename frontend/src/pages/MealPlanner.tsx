import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import PageSkeleton from "../components/PageSkeleton";
import {
  generateMealPlanApi,
  getCurrentMealPlanApi,
  getPreferencesApi,
  savePreferencesApi,
  addPantryItemApi,
  type MealPlan,
  type Preferences,
  type ShoppingList,
} from "../api/api";
import {
  Sparkles, ShoppingCart, CheckCircle2,
  Calendar, Settings2, AlertCircle, Activity, User2,
  Plus, ArrowRight, Target, Database, Terminal,
  Clock, Loader2
} from "lucide-react";

const DEFAULT_PREFS: Preferences = {
  diet: "", cuisines: [], allergies: [], excludeIngredients: [],
  maxPrepMinutes: 0, mealsPerDay: 2, repeatLimitWeekly: 2,
  height: 0, weight: 0, age: 0, gender: "", activityLevel: "",
  caloriesTarget: 2000, proteinTarget: 150, carbsTarget: 200, fatTarget: 70,
};

const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎",
};

function joinList(list: string[]) { return list.join(", "); }
function splitList(text: string) { return text.split(",").map(t => t.trim()).filter(Boolean); }
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function shortDay(value: string) {
  return new Date(value).toLocaleDateString(undefined, { weekday: "short" });
}

export default function MealPlanner() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [allergiesText, setAllergiesText] = useState("");
  const [excludeText, setExcludeText] = useState("");
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [restockingAll, setRestockingAll] = useState(false);
  const [restockedItems, setRestockedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [prefsRes, planRes] = await Promise.all([
          getPreferencesApi(), getCurrentMealPlanApi(),
        ]);
        if (!active) return;
        const loaded = prefsRes.preferences || DEFAULT_PREFS;
        setPrefs(loaded);
        setAllergiesText(joinList(loaded.allergies));
        setExcludeText(joinList(loaded.excludeIngredients));
        setPlan(planRes.plan);
        setShoppingList(planRes.shoppingList);
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load meal planner.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const calculateRecommended = () => {
    const { height, weight, age, gender, activityLevel } = prefs;
    if (!height || !weight || !age || !gender || !activityLevel) {
      setError("Please complete your profile details (Height, Weight, Age, Gender, and Activity Level).");
      return;
    }

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (gender === "male") bmr += 5;
    else bmr -= 161;

    const modifiers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
    };
    const tdee = Math.round(bmr * (modifiers[activityLevel] || 1.2));

    const protein = Math.round((tdee * 0.3) / 4);
    const carbs = Math.round((tdee * 0.4) / 4);
    const fat = Math.round((tdee * 0.3) / 9);

    setPrefs(prev => ({
      ...prev,
      caloriesTarget: tdee,
      proteinTarget: protein,
      carbsTarget: carbs,
      fatTarget: fat
    }));
    setError(null);
  };

  async function saveAndGenerate() {
    setSaving(true);
    setError(null);
    try {
      const payload: Preferences = { ...prefs, allergies: splitList(allergiesText), excludeIngredients: splitList(excludeText) };
      const saved = await savePreferencesApi(payload);
      setPrefs(saved.preferences);
      const generated = await generateMealPlanApi();
      setPlan(generated.plan);
      setShoppingList(generated.shoppingList);
      setActiveDay(0);
      setPrefsOpen(false);
    } catch (e: any) {
      setError(e?.message || "Failed to generate plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const currentDay = plan?.days[activeDay];
  const daySummary = useMemo(() => {
    if (!currentDay) return null;
    let cal = 0, p = 0, c = 0, f = 0;
    currentDay.meals.forEach(m => {
      const r = m.recipeId;
      if (r && typeof r !== "string") {
        cal += r.calories || 0;
        p += r.protein || 0;
        c += r.carbs || 0;
        f += r.fat || 0;
      }
    });
    return { cal, p, c, f };
  }, [currentDay]);

  async function restockItem(item: ShoppingList["items"][number]) {
    if (!item.ingredientId) {
      setError(`"${item.name}" not linked. Please add it manually in the Pantry.`);
      return;
    }
    try {
      await addPantryItemApi({ ingredientId: item.ingredientId, quantity: item.quantity || 1, unit: item.unit || "pcs" });
      setRestockedItems(prev => new Set(prev).add(item.name));
    } catch (e: any) {
      setError(e?.message || `Failed to add ${item.name} to pantry.`);
    }
  }

  async function restockAll() {
    if (!shoppingList?.items.length) return;
    const linked = shoppingList.items.filter(i => i.ingredientId);
    if (!linked.length) { setError("No items to add."); return; }
    try {
      setRestockingAll(true); setError(null);
      await Promise.all(linked.map(i => addPantryItemApi({ ingredientId: i.ingredientId!, quantity: i.quantity || 1, unit: i.unit || "pcs" })));
      setRestockedItems(new Set(linked.map(i => i.name)));
    } catch (e: any) {
      setError(e?.message || "Failed to update pantry.");
    } finally {
      setRestockingAll(false);
    }
  }


  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="space-y-8 pb-12">
        {/* HERO SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Meal <span className="text-blue-600">Planner</span></h2>
            <p className="text-slate-500 text-sm">
              {plan ? `Week of ${formatDate(plan.weekStart)}` : "Plan your meals for the week based on your goals."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
             <button className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-200 transition-all" onClick={() => setPrefsOpen(v => !v)}>
                <Settings2 size={14} className={prefsOpen ? "rotate-90 text-blue-600 transition-transform" : "transition-transform"} />
                Settings
             </button>
             <button className="w-full sm:w-auto justify-center bg-slate-900 text-white py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all group" onClick={saveAndGenerate} disabled={saving}>
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] uppercase font-bold tracking-widest">{saving ? "Generating…" : plan ? "New Plan" : "Create Plan"}</span>
             </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between">
            <div className="flex items-center gap-2"><AlertCircle size={14} /> {error}</div>
            <button onClick={() => setError(null)} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
          </div>
        )}

        {/* PREFERENCES PANEL */}
        <AnimatePresence>
          {prefsOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-10 space-y-10 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-50">
                   <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Plan Preferences</h3>
                      <p className="text-xs text-slate-400 font-medium">Configure your dietary and nutritional goals.</p>
                   </div>
                   <button className="w-full sm:w-auto justify-center bg-blue-50 text-blue-600 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 group border border-blue-100" onClick={calculateRecommended}>
                      <Activity size={12} className="group-hover:scale-125 transition-transform" /> Auto-fill Targets
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  <div className="space-y-6">
                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest"><User2 size={14} /> Body Data</h4>
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weight (kg)</label>
                             <input type="number" value={prefs.weight || ""} onChange={e => setPrefs({...prefs, weight: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Height (cm)</label>
                             <input type="number" value={prefs.height || ""} onChange={e => setPrefs({...prefs, height: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Activity Level</label>
                          <select value={prefs.activityLevel} onChange={e => setPrefs({...prefs, activityLevel: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold appearance-none cursor-pointer">
                            <option value="">Select...</option>
                            <option value="sedentary">Sedentary</option>
                            <option value="light">Lightly Active</option>
                            <option value="moderate">Moderately Active</option>
                            <option value="active">Very Active</option>
                          </select>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest"><Target size={14} /> Nutrition Goals</h4>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: "Calories", key: "caloriesTarget", suffix: "kcal" },
                         { label: "Protein", key: "proteinTarget", suffix: "g" },
                         { label: "Carbs", key: "carbsTarget", suffix: "g" },
                         { label: "Fat", key: "fatTarget", suffix: "g" }
                       ].map(t => (
                        <div key={t.key} className="space-y-2">
                           <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.label} ({t.suffix})</label>
                           <input type="number" value={(prefs as any)[t.key] || ""} onChange={e => setPrefs({...prefs, [t.key]: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold" />
                        </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest"><Database size={14} /> Plan Settings</h4>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dietary Preference</label>
                          <select value={prefs.diet} onChange={e => setPrefs({...prefs, diet: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold appearance-none cursor-pointer">
                            <option value="">None</option>
                            <option value="vegetarian">Vegetarian</option>
                            <option value="vegan">Vegan</option>
                            <option value="keto">Keto</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Meals per Day</label>
                          <select value={prefs.mealsPerDay} onChange={e => setPrefs({...prefs, mealsPerDay: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold appearance-none cursor-pointer">
                            <option value={2}>2 meals a day</option>
                            <option value={3}>3 meals a day</option>
                          </select>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-50">
                  <button className="px-6 py-3 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors" onClick={() => setPrefsOpen(false)}>Cancel</button>
                  <button className="bg-slate-900 text-white rounded-xl py-3 px-8 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md" onClick={saveAndGenerate} disabled={saving}>
                    {saving ? "Generating…" : "Save & Generate"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? <PageSkeleton cards={3} /> : !plan ? (
          <div className="bg-[#FAFDFF] border border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 p-12 shadow-md">
            <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-200">
               <Calendar size={48} />
            </div>
            <div className="max-w-md space-y-4">
              <h3 className="text-2xl font-bold uppercase tracking-widest text-slate-800">No meal plan yet</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Ready to plan your week? Set your goals and we'll create a meal plan for you.
              </p>
              <button className="bg-blue-600 text-white py-4 px-10 text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-3 mx-auto mt-6" onClick={saveAndGenerate} disabled={saving}>
                <Sparkles size={18} /> {saving ? "Generating…" : "Create First Plan"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* TACTICAL NAVIGATION */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 px-1 custom-scrollbar-h">
              {plan.days.map((day, i) => (
                <button 
                  key={day.date} 
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-3xl border transition-all duration-300
                    ${i === activeDay 
                      ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" 
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                  onClick={() => setActiveDay(i)}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${i === activeDay ? "text-white/80" : "text-slate-400"}`}>{shortDay(day.date)}</span>
                  <span className="text-2xl font-bold">{new Date(day.date).getDate()}</span>
                  <div className={`mt-2 w-1 h-1 rounded-full ${i === activeDay ? "bg-white" : "bg-slate-200"}`} />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* SESSION VIEW */}
              <div className="xl:col-span-8 space-y-8">
                {currentDay && (
                  <motion.div 
                    key={currentDay.date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{formatDate(currentDay.date)}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Day {activeDay + 1} of {plan.days.length}</p>
                      </div>
                      
                      {daySummary && (
                        <div className="flex items-center gap-2 bg-[#FAFDFF] border border-slate-200 p-1 rounded-2xl shadow-md">
                           {[
                             { label: "kcal", val: daySummary.cal, c: "text-blue-600" },
                             { label: "protein", val: `${daySummary.p}g`, c: "text-emerald-600" },
                             { label: "carbs", val: `${daySummary.c}g`, c: "text-amber-600" },
                             { label: "fat", val: `${daySummary.f}g`, c: "text-rose-600" }
                           ].map(s => (
                             <div key={s.label} className="px-4 py-2 text-center min-w-[70px]">
                                <p className={`text-lg font-bold leading-none ${s.c}`}>{s.val}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentDay.meals.map((meal, idx) => {
                        const recipe = meal.recipeId;
                        if (!recipe || typeof recipe === "string") return null;

                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={`${currentDay.date}-${meal.mealType}`}
                            className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-0 overflow-hidden shadow-md group hover:border-blue-200 transition-all"
                          >
                            <div className="p-6 space-y-6">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl group-hover:bg-blue-50 transition-colors">
                                        {MEAL_ICONS[meal.mealType.toLowerCase()] || "🍴"}
                                     </div>
                                     <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MEAL</p>
                                        <p className="text-xs font-bold text-slate-900 uppercase">{meal.mealType}</p>
                                     </div>
                                  </div>
                                  <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[9px] font-bold text-blue-600 uppercase tracking-widest">Active</div>
                               </div>

                               <div className="space-y-1">
                                  <Link to={`/recipes/${recipe._id}`} className="text-lg font-bold text-slate-900 tracking-tight hover:text-blue-600 transition-colors line-clamp-1 uppercase">{recipe.name}</Link>
                                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                     <Clock size={12} className="text-blue-400" /> {recipe.prepMinutes || 20}m prep
                                  </div>
                               </div>

                               <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-50">
                                  {[
                                    { k: "KCAL", v: recipe.calories || 0 },
                                    { k: "P", v: `${recipe.protein || 0}G` },
                                    { k: "C", v: `${recipe.carbs || 0}G` },
                                    { k: "F", v: `${recipe.fat || 0}G` }
                                  ].map(m => (
                                    <div key={m.k} className="text-center">
                                       <p className="text-[11px] font-bold text-slate-900 leading-none">{m.v}</p>
                                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{m.k}</p>
                                    </div>
                                  ))}
                               </div>
                               
                               <Link to={`/recipes/${recipe._id}`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">
                                  View Recipe <ArrowRight size={14} />
                                </Link>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* LOGISTICS PANEL */}
              <div className="xl:col-span-4 space-y-6">
                <div className="bg-[#FAFDFF] border border-slate-200 rounded-3xl space-y-8 p-8 shadow-md">
                   <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><ShoppingCart size={20} /></div>
                         <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Grocery List</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Items to buy</p>
                         </div>
                      </div>
                      {shoppingList && shoppingList.items.length > 0 && (
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all group" onClick={restockAll} disabled={restockingAll}>
                           {restockingAll ? <Loader2 className="animate-spin" size={12} /> : <Plus size={12} className="group-hover:rotate-90 transition-transform" />}
                           Restock All
                        </button>
                      )}
                   </div>

                   {!shoppingList || !shoppingList.items.length ? (
                      <div className="py-12 flex flex-col items-center text-center space-y-4">
                         <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={32} />
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Everything's here!</p>
                            <p className="text-[10px] text-slate-400 font-medium">You have all the ingredients for your plan.</p>
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-3">
                        {shoppingList.items.map((item, idx) => {
                          const done = restockedItems.has(item.name);
                          return (
                            <motion.div 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all
                                ${done 
                                  ? "bg-emerald-50 border-emerald-100 opacity-60" 
                                  : "bg-slate-50 border-slate-200 hover:border-slate-200 shadow-md"}`}
                              key={item.name}
                            >
                              <div className="space-y-1">
                                 <p className={`text-xs font-bold uppercase transition-colors ${done ? "text-emerald-600" : "text-slate-900"}`}>{item.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.quantity} {item.unit}</p>
                              </div>
                              <button 
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                  ${done 
                                    ? "bg-emerald-600 text-white shadow-md" 
                                    : "bg-[#FAFDFF] border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 shadow-md"}`}
                                onClick={() => restockItem(item)} 
                                disabled={done}
                              >
                                {done ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                   )}

                   <div className="pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 shadow-md">
                         <Terminal size={14} className="text-blue-400" />
                         <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-relaxed">Note: Added items will appear in your kitchen pantry immediately.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
