import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  X
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { 
  getNotificationsApi, 
  markNotificationAsReadApi, 
  markAllNotificationsAsReadApi, 
  deleteNotificationApi,
  type Notification 
} from "../api/api";
import { formatFullTimestamp } from "../utils/timeUtils";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, high, expiry, stock

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotificationsApi();
      setNotifications(res.notifications);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      if (id.startsWith('temp-')) return; // Can't mark synthesized alerts as read in DB
      await markNotificationAsReadApi(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
       console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (id.startsWith('temp-')) return; // Can't delete synthesized alerts
      await deleteNotificationApi(id);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    if (filter === "high") return n.priority === "high";
    if (filter === "expiry") return n.type === "expiry";
    if (filter === "stock") return n.type === "low_stock";
    return true;
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12 min-w-0">
        
        {/* HEADER AREA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications & <span className="text-blue-600">Alerts</span></h1>
            <p className="text-slate-500 text-sm">Stay updated with your kitchen's status and system events.</p>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={handleMarkAllAsRead}
                className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
             >
                <CheckCircle2 size={14} /> Mark all as read
             </button>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="flex flex-wrap items-center gap-4 px-2">
           {[
             { id: "all", label: "ALL EVENTS" },
             { id: "unread", label: "UNREAD" },
             { id: "high", label: "URGENT" },
             { id: "expiry", label: "EXPIRY" },
             { id: "stock", label: "LOW STOCK" }
           ].map(opt => (
             <button
               key={opt.id}
               onClick={() => setFilter(opt.id)}
               className={`px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                 filter === opt.id 
                 ? "bg-blue-600 text-white shadow-md" 
                 : "bg-[#FAFDFF] border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 shadow-sm"
               }`}
             >
               {opt.label}
             </button>
           ))}
        </div>

        {/* NOTIFICATION FEED */}
        <div className="space-y-4 px-2">
           {loading ? (
             <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
               <Loader2 className="animate-spin text-blue-600" size={48} />
               <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Syncing kitchen alerts...</p>
             </div>
           ) : filteredNotifs.length > 0 ? (
             <AnimatePresence mode="popLayout">
               {filteredNotifs.map((notif) => (
                 <motion.div 
                    key={notif._id}
                    variants={item}
                    layout
                    className={`p-6 rounded-3xl border transition-all flex items-center justify-between gap-6 group shadow-md
                      ${!notif.isRead ? 'bg-white border-blue-100 ring-1 ring-blue-50' : 'bg-[#FAFDFF] border-slate-200'}
                    `}
                 >
                   <div className="flex items-center gap-6 min-w-0 flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm
                        ${notif.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}
                      `}>
                         {notif.type === 'expiry' ? <Clock size={24} /> : notif.type === 'low_stock' ? <AlertTriangle size={24} /> : <Bell size={24} />}
                      </div>
                      <div className="space-y-1 min-w-0">
                         <div className="flex items-center gap-3">
                            <h3 className={`font-bold tracking-tight truncate ${!notif.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</h3>
                            {!notif.isRead && (
                               <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                            )}
                         </div>
                         <p className="text-sm text-slate-500 font-medium line-clamp-2">{notif.message}</p>
                         <div className="flex flex-col gap-0.5 pt-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                               <Clock size={12} /> {formatFullTimestamp(notif.createdAt).relative}
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                               {formatFullTimestamp(notif.createdAt).exact}
                            </div>
                         </div>
                         <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 font-bold uppercase tracking-widest text-[9px]">
                            {notif.priority === 'high' && (
                               <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Urgent</span>
                            )}
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      {!notif.isRead && !notif._id.startsWith('temp-') && (
                        <button 
                          onClick={() => handleMarkAsRead(notif._id)}
                          className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Mark as read"
                        >
                           <CheckCircle2 size={18} />
                        </button>
                      )}
                      {!notif._id.startsWith('temp-') && (
                        <button 
                          onClick={() => handleDelete(notif._id)}
                          className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                           <Trash2 size={18} />
                        </button>
                      )}
                      {notif._id.startsWith('temp-') && (
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">Live System Alert</span>
                      )}
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           ) : (
             <div className="bg-[#FAFDFF] border border-slate-200 rounded-[3rem] p-24 text-center space-y-4 shadow-md mx-2">
                <div className="w-24 h-24 rounded-[3rem] bg-slate-50 flex items-center justify-center text-slate-200 mx-auto">
                   <Bell size={48} strokeWidth={1} />
                </div>
                <div className="space-y-1">
                   <h4 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Perfect Silence</h4>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">You are all caught up on kitchen events.</p>
                </div>
             </div>
           )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
