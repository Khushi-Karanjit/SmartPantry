import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  UserX, 
  UserCheck, 
  Trash2, 
  Users,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Database
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { 
  getAdminUsersApi, 
  toggleUserStatusApi, 
  deleteUserApi, 
} from "../api/api";
import type { AdminUser } from "../api/api";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [q]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsersApi(q);
      setUsers(res.users);
      setError("");
    } catch (err: any) {
      setError(err.message || "Protocol Error: Entity downlink rejected");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleUserStatusApi(id);
      fetchUsers();
    } catch (err: any) {
      console.error(err.message || "Override Refused: Status update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CONFIRM DELETION: Entity link will be permanently severed.")) return;
    try {
      await deleteUserApi(id);
      fetchUsers();
    } catch (err: any) {
      console.error(err.message || "Security Violation: Deletion refused");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  if (loading && users.length === 0) return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 text-blue-600">
           <Database className="animate-pulse" size={64} />
           <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading Users...</p>
        </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12 min-w-0">
           
           {/* HEADER */}
           <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2 min-w-0">
              <div className="space-y-1 min-w-0">
                 <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">User <span className="text-blue-600">Management</span></h1>
                 <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1 rounded-full w-fit mt-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    <span className="truncate">Directory: {users.length} Records</span>
                 </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto">
                 <div className="relative w-full sm:max-w-xs">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                       className="w-full bg-[#FAFDFF] border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-md"
                       type="text" 
                       placeholder="Search users..." 
                       value={q}
                       onChange={(e) => setQ(e.target.value)}
                    />
                 </div>
                 <button className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FAFDFF] border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-md">
                    <ArrowUpRight size={16} /> Export
                 </button>
              </div>
           </motion.div>

           {error && (
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
                <ShieldAlert size={18} /> {error}
             </motion.div>
           )}

           {/* MAIN USER TABLE */}
           <section className="bg-[#FAFDFF] border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col min-w-0 max-w-full">
              <div className="p-4 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between min-w-0">
                 <div className="flex items-center gap-3 min-w-0">
                    <Users size={24} className="text-blue-600 shrink-0" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">User Directory</h3>
                 </div>
                 <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-green-50 border border-green-200 text-[10px] sm:text-xs font-bold text-green-700 uppercase whitespace-nowrap shrink-0">
                    Live Data
                 </div>
              </div>

              <div className="overflow-x-auto w-full max-w-full">
                 <table className="w-full text-left whitespace-nowrap min-w-full">
                    <thead>
                       <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {!loading && users.length === 0 && (
                         <tr><td colSpan={5} className="p-20 text-center text-slate-500 text-sm">No users found.</td></tr>
                       )}

                       {users.map((user: AdminUser) => (
                         <motion.tr 
                           variants={item}
                           className="hover:bg-slate-50 transition-colors group" 
                           key={user._id}
                         >
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase text-lg">
                                    {user.username.charAt(0)}
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-900">{user.username}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase
                                ${user.role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                {user.role}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                 <span className={`text-xs font-bold uppercase ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {user.isActive ? "Active" : "Disabled"}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                   className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                     ${user.isActive 
                                       ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" 
                                       : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                                   onClick={() => handleToggleStatus(user._id)}
                                   title={user.isActive ? "Disable User" : "Enable User"}
                                 >
                                   {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                 </button>
                                 <button 
                                   className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed" 
                                   onClick={() => handleDelete(user._id)}
                                   title="Delete User"
                                   disabled={user.role === 'admin'}
                                 >
                                   <Trash2 size={16} />
                                 </button>
                              </div>
                           </td>
                         </motion.tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200">
                 <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Showing {users.length} users</p>
                    <div className="flex items-center gap-2 text-slate-400">
                       <ShieldCheck size={16} />
                       <span className="text-xs font-semibold">Secure Connection</span>
                    </div>
                 </div>
              </div>
           </section>
        </motion.div>
    </DashboardLayout>
  );
}
