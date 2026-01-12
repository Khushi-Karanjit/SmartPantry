import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Refrigerator,
  Settings,
  BookOpen,
  CalendarDays,
  ShoppingCart,
  User,
  LogOut,
} from "lucide-react";
import { clearAuth } from "../auth/auth";
import "../styles/dashboard.css";

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

  const wrapperClass = variant === "desktop" ? "sidebar" : "";

  const items: NavItem[] = [
    { label: "Dashboard", path: "/home", icon: <LayoutDashboard size={18} /> },
    { label: "Pantry", path: "/pantry", icon: <Refrigerator size={18} /> },
    { label: "Pantry Setup", path: "/pantry-setup", icon: <Settings size={18} /> },
    { label: "Recipes", path: "/recipes", icon: <BookOpen size={18} /> },
    { label: "Meal Planner", path: "/meal-planner", icon: <CalendarDays size={18} /> },
    { label: "Shopping List", path: "/shopping-list", icon: <ShoppingCart size={18} /> },
    { label: "Profile", path: "/profile", icon: <User size={18} /> },
  ];

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
