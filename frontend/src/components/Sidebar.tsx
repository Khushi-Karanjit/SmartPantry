import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Refrigerator,
  BookOpen,
  CalendarDays,
  User,
  Shield,
  LogOut,
  BarChart,
  ScrollText,
  PlusSquare,
  Sparkles,
  Heart,
  ShoppingCart
} from "lucide-react";
import { clearAuth, getUser } from "../auth/auth";

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

export default function Sidebar({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "drawer";
  onNavigate?: () => void;
}) {
  const loc = useLocation();
  const nav = useNavigate();
  const user = getUser();

  const isAdminRoute = loc.pathname.startsWith("/admin");

  const commonItems: NavItem[] = [
    { label: "Dashboard", path: "/home", icon: <LayoutDashboard size={20} /> },
    { label: "Pantry", path: "/pantry", icon: <Refrigerator size={20} /> },
    { label: "My Kitchen Setup", path: "/pantry-setup", icon: <PlusSquare size={20} /> },
    { label: "Recipes", path: "/recipes", icon: <BookOpen size={20} /> },
    { label: "Favourites", path: "/recipes/favourites", icon: <Heart size={20} /> },
    { label: "Find Recipes", path: "/recipe-suggester", icon: <Sparkles size={20} /> },
    { label: "Meal Planner", path: "/meal-planner", icon: <CalendarDays size={20} /> },
    { label: "Shopping List", path: "/shopping-list", icon: <ShoppingCart size={20} /> },
    { label: "Analytics", path: "/analytics", icon: <BarChart size={20} /> },
    { label: "Profile", path: "/profile", icon: <User size={20} /> },
  ];

  const adminItems: NavItem[] = [
    { label: "Admin Console", path: "/admin", icon: <Shield size={20} /> },
    { label: "New Recipe", path: "/admin/recipes/new", icon: <PlusSquare size={20} /> },
    { label: "Manage Users", path: "/admin/users", icon: <User size={20} /> },
    { label: "Admin Data", path: "/admin/analytics", icon: <BarChart size={20} /> },
    { label: "System Logs", path: "/admin/logs", icon: <ScrollText size={20} /> },
  ];

  const items = isAdminRoute ? adminItems : commonItems;

  if (user?.role === "admin") {
    if (isAdminRoute) {
      items.push({ label: "Go Home", path: "/home", icon: <LogOut size={20} /> });
    } else {
      items.push({ label: "Admin Panel", path: "/admin", icon: <Shield size={20} /> });
    }
  }

  function go(path: string) {
    nav(path);
    onNavigate?.();
  }

  function logout() {
    clearAuth();
    nav("/login");
    onNavigate?.();
  }

  return (
    <div className={`h-full flex flex-col glass-nav p-6 ${variant === "desktop" ? "border-r border-white/5" : ""}`}>
      {/* BRANDING */}
      <div className="flex items-center gap-4 mb-10 px-2 cursor-pointer" onClick={() => go("/")}>
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]">
          SP
        </div>
        <div className="text-xl font-bold tracking-tight text-slate-800">
          Smart<span className="text-primary font-black">Pantry</span>
        </div>
      </div>

      {/* NAVIGATION LIST */}
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {items.map((it) => {
          const active = loc.pathname === it.path;
          return (
            <motion.div
              key={it.path}
              whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-colors duration-200
                ${active 
                  ? "bg-blue-50 text-blue-600 shadow-md" 
                  : "text-slate-500 hover:text-slate-900"
                }
              `}
              onClick={() => go(it.path)}
            >
              <div className={`${active ? "text-primary" : "text-inherit"}`}>
                {it.icon}
              </div>
              <span className="font-semibold text-sm tracking-wide">{it.label}</span>
            </motion.div>
          );
        })}
      </nav>

      {/* FOOTER ACTION */}
      <div className="pt-6 mt-6 border-t border-white/5">
        <motion.button
          whileHover={{ x: 4, backgroundColor: "rgba(239,68,68,0.05)" }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-semibold text-sm tracking-wide">Log Out</span>
        </motion.button>
      </div>
    </div>
  );
}

