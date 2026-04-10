import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit2, 
  Lock, 
  History, 
  Bookmark, 
  Save, 
  X,
  ChefHat,
  Refrigerator,
  Utensils,
  Trash2,
  Activity,
  ShieldCheck,
  Loader2,
  Fingerprint,
  Database
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { 
  getProfileApi, 
  updateProfileApi, 
  changePasswordApi, 
  toggleSaveRecipeApi,
  type UserProfile,
} from "../api/api";

export default function Profile() {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "security" | "activity">("overview");

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", email: "", avatarUrl: "" });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Password State
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfileApi();
      setData(res);
      setEditForm({ 
        username: res.profile.username, 
        email: res.profile.email, 
        avatarUrl: res.profile.avatarUrl || "" 
      });
    } catch (err: any) {
      console.error(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      await updateProfileApi(editForm);
      setIsEditing(false);
      fetchProfile();
    } catch (err: any) {
      console.error(err.message || "Update failed. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return console.warn("Passwords do not match");
    }
    try {
      setPassLoading(true);
      await changePasswordApi({ 
        currentPassword: passForm.currentPassword, 
        newPassword: passForm.newPassword 
      });
      setPassSuccess("Password updated successfully.");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPassSuccess(""), 3000);
    } catch (err: any) {
      console.error(err.message || "Password change failed.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleUnsave = async (id: string) => {
    try {
      await toggleSaveRecipeApi(id);
      fetchProfile();
    } catch (err: any) {
      console.error("Failed to remove recipe.");
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
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
           <Loader2 className="animate-spin text-blue-600" size={48} />
           <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading your profile...</p>
        </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
           {/* IDENTITY HEADER */}
           <motion.div variants={item} className="relative">
              <div className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-10 shadow-md">
                 <div className="relative">
                    <div className="w-32 h-32 rounded-[2.5rem] border-2 border-blue-100 p-2 group-hover:border-blue-200 transition-colors duration-500 overflow-hidden">
                        {data?.profile.avatarUrl ? (
                          <img src={data.profile.avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-[1.5rem]" />
                        ) : (
                          <div className="w-full h-full bg-blue-50 flex items-center justify-center text-4xl font-bold text-blue-600 rounded-[1.5rem]">
                            {data?.profile.username.charAt(0)}
                          </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#FAFDFF] border border-slate-200 flex items-center justify-center text-blue-600 shadow-md">
                       <ShieldCheck size={20} />
                    </div>
                 </div>

                 <div className="flex-1 space-y-4 text-center md:text-left">
                     <div>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                           <h2 className="text-4xl font-bold tracking-tight text-slate-900">{data?.profile.username}</h2>
                           <div className={`px-3 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest
                             ${data?.profile.role === 'admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                             {data?.profile.role} account
                           </div>
                        </div>
                        <p className="text-slate-500 font-medium tracking-wide mt-1 flex items-center justify-center md:justify-start gap-2">
                           <Mail size={14} className="text-blue-400" /> {data?.profile.email}
                        </p>
                     </div>
                     <div className="flex items-center justify-center md:justify-start gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                           <Calendar size={12} className="text-blue-500" /> Joined {new Date(data?.profile.createdAt || "").toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                           <Fingerprint size={12} className="text-blue-500" /> ID: {data?.profile.id.slice(-8).toUpperCase()}
                        </div>
                     </div>
                 </div>
              </div>
           </motion.div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* MAIN CONTENT AREA */}
              <div className="lg:col-span-8 space-y-8">
                 {/* NAV TABS */}
                 <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1 p-1 bg-slate-100 border border-slate-200 rounded-2xl">
                    {[
                      { id: "overview", icon: <User size={16} />, label: "Overview" },
                      { id: "security", icon: <Lock size={16} />, label: "Security" },
                      { id: "activity", icon: <History size={16} />, label: "Activity Log" }
                    ].map(t => (
                      <button 
                        key={t.id}
                        className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                          ${activeTab === t.id 
                            ? "bg-white text-slate-900 shadow-md border border-slate-200" 
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                        onClick={() => setActiveTab(t.id as any)}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                 </div>

                 {/* TAB CONTENT */}
                 <AnimatePresence mode="wait">
                    <motion.div
                       key={activeTab}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                    >
                       {activeTab === 'overview' && (
                         <section className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-8 space-y-10 shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-6 w-full">
                               <div className="space-y-1">
                                  <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Personal Details</h3>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core account configuration</p>
                               </div>
                               <button className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${isEditing ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-slate-900 text-white hover:bg-slate-800"}`} onClick={() => setIsEditing(!isEditing)}>
                                  {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                                  {isEditing ? "Cancel" : "Edit Profile"}
                               </button>
                            </div>

                            {!isEditing ? (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 {[
                                   { label: "Username", val: data?.profile.username, icon: <User size={16} /> },
                                   { label: "Email Address", val: data?.profile.email, icon: <Mail size={16} /> },
                                   { label: "Account Type", val: `${data?.profile.role.toUpperCase()} USER`, icon: <Shield size={16} /> },
                                   { label: "Joined On", val: new Date(data?.profile.createdAt || "").toLocaleDateString(), icon: <Calendar size={16} /> }
                                 ].map(d => (
                                   <div key={d.label} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                      <div className="w-10 h-10 rounded-xl bg-[#FAFDFF] border border-slate-200 flex items-center justify-center text-blue-600">{d.icon}</div>
                                      <div>
                                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d.label}</p>
                                         <p className="text-sm font-bold text-slate-800 uppercase">{d.val}</p>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                            ) : (
                              <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-xl">
                                 <div className="space-y-6">
                                    {[
                                      { label: "Username", key: "username", type: "text" },
                                      { label: "Email Address", key: "email", type: "email" },
                                      { label: "Avatar Image URL", key: "avatarUrl", type: "text" }
                                    ].map(f => (
                                      <div key={f.key} className="space-y-2">
                                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{f.label}</label>
                                         <input 
                                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold"
                                           type={f.type} 
                                           value={(editForm as any)[f.key]}
                                           onChange={(e) => setEditForm({...editForm, [f.key]: e.target.value})}
                                           required={f.key !== 'avatarUrl'}
                                         />
                                      </div>
                                    ))}
                                 </div>
                                 <button type="submit" className="bg-blue-600 text-white py-4 px-10 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 w-full rounded-xl shadow-lg hover:bg-blue-700 transition-all" disabled={updateLoading}>
                                    {updateLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                                    {updateLoading ? "Saving..." : "Save Profile Details"}
                                 </button>
                              </form>
                            )}
                         </section>
                       )}

                       {activeTab === 'security' && (
                         <section className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-8 space-y-10 shadow-md">
                            <div className="space-y-1 border-b border-slate-50 pb-6">
                               <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Security</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password and account security</p>
                            </div>
                            
                            {passSuccess && (
                              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                 <ShieldCheck size={16} /> {passSuccess}
                              </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-8 max-w-xl">
                               <div className="space-y-6">
                                  {[
                                    { label: "Current Password", key: "currentPassword" },
                                    { label: "New Password", key: "newPassword" },
                                    { label: "Confirm New Password", key: "confirmPassword" }
                                  ].map(f => (
                                    <div key={f.key} className="space-y-2">
                                       <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{f.label}</label>
                                       <input 
                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-bold"
                                         type="password" 
                                         value={(passForm as any)[f.key]}
                                         onChange={(e) => setPassForm({...passForm, [f.key]: e.target.value})}
                                         required
                                       />
                                    </div>
                                  ))}
                               </div>
                               <button type="submit" className="bg-blue-600 text-white py-4 px-10 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 w-full rounded-xl shadow-lg hover:bg-blue-700 transition-all" disabled={passLoading}>
                                  {passLoading ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />} 
                                  {passLoading ? "Updating..." : "Update Password"}
                               </button>
                            </form>
                         </section>
                       )}

                       {activeTab === 'activity' && (
                         <section className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-0 shadow-md overflow-hidden">
                            <div className="p-8 border-b border-slate-50">
                               <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Activity History</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History of your cooked recipes</p>
                            </div>
                            
                            <div className="divide-y divide-slate-50">
                               {data?.recentLogs.length === 0 && <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No activity found yet.</div>}
                               {data?.recentLogs.map((log: any, idx: number) => (
                                 <motion.div 
                                   initial={{ opacity: 0, x: -10 }} 
                                   animate={{ opacity: 1, x: 0 }} 
                                   transition={{ delay: idx * 0.05 }}
                                   className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group" 
                                   key={log._id}
                                 >
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                         <ChefHat size={20} />
                                      </div>
                                      <div>
                                         <p className="text-sm font-bold text-slate-800 uppercase group-hover:text-blue-600 transition-colors">{log.recipeId?.name || "Recipe Block"}</p>
                                         <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            <Activity size={10} className="text-blue-400" /> Servings: {log.servings || 1}
                                         </div>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[10px] font-bold text-slate-900 uppercase">{new Date(log.performedAt).toLocaleDateString()}</p>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recorded</p>
                                   </div>
                                 </motion.div>
                               ))}
                            </div>
                         </section>
                       )}
                    </motion.div>
                 </AnimatePresence>
              </div>

              {/* SIDEBAR STACK */}
              <div className="lg:col-span-4 space-y-8">
                 {/* MINI STATS */}
                 <div className="grid grid-cols-1 gap-4">
                    {[
                      { l: "Kitchen Items", v: data?.stats.totalPantryItems, i: <Refrigerator size={24} />, c: "text-blue-600", bg: "bg-blue-50" },
                      { l: "Recipes Cooked", v: data?.stats.totalCooked, i: <ChefHat size={24} />, c: "text-emerald-600", bg: "bg-emerald-50" },
                      { l: "Top Ingredient", v: data?.stats.mostStoredIngredient, i: <Utensils size={24} />, c: "text-amber-600", bg: "bg-amber-50" }
                    ].map(s => (
                      <div key={s.l} className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-6 flex items-center gap-6 shadow-md group hover:border-blue-200 transition-colors">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} ${s.c} group-hover:scale-105 transition-transform`}>
                            {s.i}
                         </div>
                         <div>
                            <p className="text-2xl font-bold text-slate-900 tracking-tight uppercase">{s.v}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.l}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* SAVED RECIPES */}
                 <section className="bg-[#FAFDFF] border border-slate-200 rounded-3xl p-0 shadow-md overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                       <Bookmark size={18} className="text-blue-600" />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Saved Recipes</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {data?.savedRecipes.length === 0 && <div className="p-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No saved recipes.</div>}
                       {data?.savedRecipes.map((item: any, idx: number) => (
                         <motion.div 
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 0.5 + (idx * 0.05) }}
                           className="p-6 hover:bg-slate-50 transition-colors group flex items-center justify-between" 
                           key={item._id}
                         >
                           <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-700 uppercase line-clamp-1 group-hover:text-blue-600 transition-colors">{item.recipeId?.name}</p>
                              <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                 <span className="text-blue-500">{item.recipeId?.cuisine}</span>
                                 <span>&middot;</span>
                                 <span>{item.recipeId?.prepMinutes}m prep</span>
                              </div>
                           </div>
                           <button className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-inner" onClick={() => handleUnsave(item.recipeId._id)}>
                              <Trash2 size={14} />
                           </button>
                         </motion.div>
                       ))}
                    </div>
                    {data && data.savedRecipes.length > 0 && (
                       <div className="p-4 bg-slate-50 border-t border-slate-200">
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                             <Database size={12} className="text-blue-600" />
                             <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">Your profile is up to date</p>
                          </div>
                       </div>
                    )}
                 </section>
              </div>
           </div>
        </motion.div>
    </DashboardLayout>
  );
}
