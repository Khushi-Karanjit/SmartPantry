import { useLocation, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { clearAuth, getUser } from "../auth/auth";
import "../styles/Dashboard.css";

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
  const wrapperClass = variant === "desktop" ? "sidebar" : "";

  const commonItems: NavItem[] = [
    { label: "Dashboard", path: "/home", icon: <LayoutDashboard size={18} /> },
    { label: "Pantry", path: "/pantry", icon: <Refrigerator size={18} /> },
    { label: "Pantry Setup", path: "/pantry-setup", icon: <PlusSquare size={18} /> },
    { label: "Recipes", path: "/recipes", icon: <BookOpen size={18} /> },
    { label: "Recipe Suggester", path: "/recipe-suggester", icon: <Sparkles size={18} /> },
    { label: "Meal Planner", path: "/meal-planner", icon: <CalendarDays size={18} /> },
    { label: "Profile", path: "/profile", icon: <User size={18} /> },
  ];

  const adminItems: NavItem[] = [
    { label: "Admin Home", path: "/admin", icon: <Shield size={18} /> },
    { label: "Manage Recipes", path: "/admin/recipes/new", icon: <PlusSquare size={18} /> },
    { label: "User Management", path: "/admin/users", icon: <User size={18} /> },
    { label: "Analytics", path: "/admin/analytics", icon: <BarChart size={18} /> },
    { label: "Activity Logs", path: "/admin/logs", icon: <ScrollText size={18} /> },
  ];

  const items = isAdminRoute ? adminItems : commonItems;

  // Add "Back to User View" or "Admin" link at the bottom
  const footerItems: NavItem[] = [];
  if (user?.role === "admin") {
    if (isAdminRoute) {
      footerItems.push({ label: "Exit Admin", path: "/home", icon: <LogOut size={18} /> });
    } else {
      footerItems.push({ label: "Admin Panel", path: "/admin", icon: <Shield size={18} /> });
    }
  }

  items.push(...footerItems);

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
    <aside className={wrapperClass}>
      <div className="brand">
        <div className="brand-logo">SP</div>
        <div className="brand-name">SmartPantry</div>
      </div>

      <div className="nav">
        {items.map((it) => {
          const active = loc.pathname === it.path;
          return (
            <a
              key={it.path}
              href={it.path}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                go(it.path);
              }}
            >
              {it.icon}
              {it.label}
            </a>
          );
        })}
      </div>

      <div className="nav-spacer" />

      <div className="logout">
        <button
          className="nav-item"
          onClick={logout}
          style={{ width: "100%", background: "transparent", border: "none" }}
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
