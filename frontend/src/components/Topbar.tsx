import { Menu } from "lucide-react";
import { getUser } from "../auth/auth";
import NotificationBell from "./NotificationBell";
import "../styles/Dashboard.css";

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const user = getUser();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn hamburger"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Welcome back, {user?.username ?? "User"}!</h1>
          <p>Here's what's happening in your kitchen today.</p>
        </div>
      </div>

      <NotificationBell />
    </div>
  );
}
