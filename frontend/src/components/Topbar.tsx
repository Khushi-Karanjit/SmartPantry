import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import { getUser } from "../auth/auth";
import NotificationBell from "./NotificationBell";

export default function Topbar({ 
  onOpenMenu, 
  customTitle, 
  customActions 
}: { 
  onOpenMenu: () => void;
  customTitle?: React.ReactNode;
  customActions?: React.ReactNode;
}) {
  const user = getUser();

  return (
    <header className="sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/80 border-b border-slate-200">
      <div className="flex items-center gap-6">
        {/* Mobile Hamburger */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "#f1f5f9" }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenMenu}
          className="lg:hidden p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900"
        >
          <Menu size={20} />
        </motion.button>

        {/* Welcome Text or Custom Title */}
        <div className="hidden sm:block">
          {customTitle ? (
             customTitle
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                Hello, <span className="text-primary font-black uppercase tracking-tight">{user?.username ?? "User"}</span>
                <motion.span 
                  animate={{ rotate: [0, 20, 0] }} 
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                  className="inline-block origin-bottom-right"
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                Have a great day in the kitchen!
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {customActions && (
           <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              {customActions}
           </div>
        )}
        
        {/* Notification Bell Component Wrapper */}
        <div className="relative group">
          <NotificationBell />
        </div>

        {/* Profile Circle */}
        <div className="w-10 h-10 rounded-full border border-blue-100 p-0.5 bg-blue-50">
           <div className="w-full h-full rounded-full bg-white border border-blue-100 flex items-center justify-center text-xs font-bold text-primary">
              {user?.username?.[0]?.toUpperCase() ?? "U"}
           </div>
        </div>
      </div>
    </header>
  );
}
