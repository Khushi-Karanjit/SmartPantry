import { useEffect, useState } from "react";
import { meApi, type AuthUser } from "../api/api";
import { clearAuth, getUser } from "../auth/auth";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(getUser());
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await meApi();
        setUser(res.user);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Session expired. Please login again.");
        clearAuth();
        nav("/login");
      }
    }
    load();
  }, [nav]);

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Home</h2>
      {err && <p style={{ color: "#b00020" }}>{err}</p>}
      {user && (
        <div style={{ padding: 16, borderRadius: 16, background: "rgba(147,166,118,0.12)" }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Welcome, {user.username}</div>
          <div style={{ marginTop: 6, color: "#5f5f5f" }}>
            This is your protected dashboard. Next we’ll add Pantry, Recipes, Meal Planner.
          </div>
        </div>
      )}
    </div>
  );
}
