import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";

export default function DashboardLayout(props: {
  topbar: (openMenu: () => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openMenu = () => setOpen(true);
  const closeMenu = () => setOpen(false);

  // Close on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="dashboard-root">
      {/* Desktop sidebar */}
      <Sidebar variant="desktop" />

      {/* Mobile overlay */}
      <div
        className={`drawer-overlay ${open ? "open" : ""}`}
        onClick={closeMenu}
      />

      {/* Mobile drawer */}
      <div className={`drawer ${open ? "open" : ""}`}>
        <Sidebar variant="drawer" onNavigate={closeMenu} />
      </div>

      <main className="main">
        {props.topbar(openMenu)}
        {props.children}
      </main>
    </div>
  );
}
