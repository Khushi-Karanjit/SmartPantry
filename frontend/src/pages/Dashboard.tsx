// frontend/src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import "../styles/Dashboard.css";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  CircleAlert,
  TrendingDown,
  ChevronRight,
  Sparkles,
  PlusSquare
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type DashboardSummary = {
  stats: {
    totalItems: number;
    expiringSoonCount: number;
    capacityUsedPercent: number;
    mealsPlannedToday: number;
  };
  reminders: {
    type: "expired" | "expiring" | "low";
    text: string;
    meta: string | null;
  }[];
  composition: {
    category: string;
    count: number;
    percent: number;
  }[];
};

function getToken(): string {
  return localStorage.getItem("token") || "";
}

async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const token = getToken();

  if (!token) {
    throw new Error("Login required. Token not found.");
  }

  const res = await fetch(`${API_BASE}/api/dashboard/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as DashboardSummary;
}

function formatRelative(metaIso: string) {
  const d = new Date(metaIso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;
  }
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "in 1 day";
  return `in ${diffDays} days`;
}

function alertUi(type: "expired" | "expiring" | "low") {
  if (type === "expired") return { cls: "red", icon: <CircleAlert size={16} /> };
  if (type === "expiring") return { cls: "yellow", icon: <Clock size={16} /> };
  return { cls: "blue", icon: <TrendingDown size={16} /> };
}

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const summary = await fetchDashboardSummary();
        if (alive) setData(summary);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const stats = data?.stats;

  const topComposition = useMemo(() => {
    const list = data?.composition || [];
    return list.slice(0, 4);
  }, [data]);

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      {loading && (
        <div className="card section">
          <div className="section-head">
            <h3 className="section-title">Dashboard</h3>
          </div>
          <div className="section-body">Loading...</div>
        </div>
      )}

      {!loading && error && (
        <div className="card section">
          <div className="section-head">
            <h3 className="section-title">Dashboard</h3>
          </div>
          <div className="section-body">Error: {error}</div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Welcome Banner if Pantry is Empty */}
          {stats?.totalItems === 0 && (
            <div className="card section welcome-banner" style={{ background: 'linear-gradient(135deg, #93a676 0%, #6b8c42 100%)', color: 'white', marginBottom: '1.5rem', border: 'none' }}>
              <div className="section-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome to SmartPantry!</h2>
                  <p style={{ opacity: 0.9 }}>Your kitchen is currently empty. Start by initializing your pantry with our curated sets.</p>
                </div>
                <button 
                  onClick={() => nav('/pantry-setup')}
                  style={{ 
                    background: 'white', 
                    color: '#6b8c42', 
                    padding: '0.75rem 1.25rem', 
                    borderRadius: '0.75rem', 
                    fontWeight: 600, 
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Setup My Pantry
                </button>
              </div>
            </div>
          )}

          {/* Top Stats */}
          <div className="grid-3">
            <StatCard
              title="Pantry Status"
              value={`${stats?.totalItems ?? 0} Items`}
              sub={`${stats?.capacityUsedPercent ?? 0}% capacity utilized`}
              icon={<CheckCircle2 size={18} />}
            />

            <StatCard
              title="Expiring Soon"
              value={`${stats?.expiringSoonCount ?? 0} Items`}
              sub="Needs attention within 48h"
              icon={<AlertTriangle size={18} />}
            />

            <StatCard
              title="Today's Meals"
              value={`${stats?.mealsPlannedToday ?? 0} Planned`}
              sub="Breakfast, Lunch, Dinner"
              icon={<Clock size={18} />}
            />
          </div>

          {/* Bottom Sections */}
          <div className="grid-2">
            {/* Alerts */}
            <div className="card section">
              <div className="section-head">
                <h3 className="section-title">Reminders & Alerts</h3>
                <a className="section-link" href="#" onClick={(e) => e.preventDefault()}>
                  View All
                </a>
              </div>

              <div className="alerts">
                {data.reminders?.length ? (
                  data.reminders.slice(0, 3).map((r, idx) => {
                    const ui = alertUi(r.type);
                    const suffix =
                      r.meta && (r.type === "expired" || r.type === "expiring")
                        ? ` (${formatRelative(r.meta)})`
                        : "";

                    return (
                      <div className={`alert ${ui.cls}`} key={`${r.type}-${idx}`}>
                        <div className="alert-left">
                          <div className="pill" aria-hidden="true">
                            {ui.icon}
                          </div>
                          <div className="alert-text">
                            {r.text}
                            {suffix}
                          </div>
                        </div>
                        <div className="chev" aria-hidden="true">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="alert blue">
                    <div className="alert-left">
                      <div className="pill" aria-hidden="true">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="alert-text">No alerts right now</div>
                    </div>
                    <div className="chev" aria-hidden="true">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kitchen Tools */}
            <div className="card section">
              <div className="section-head">
                <h3 className="section-title">Kitchen Tools</h3>
              </div>
              <div className="tools-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.5rem' }}>
                <button 
                  onClick={() => nav('/recipe-suggester')}
                  className="tool-card"
                  style={{ 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    color: '#c7d2fe',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sparkles size={24} style={{ marginBottom: '0.75rem', color: '#818cf8' }} />
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>Recipe Suggester</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>What can I cook with what I have?</div>
                </button>

                <button 
                  onClick={() => nav('/pantry-setup')}
                  className="tool-card"
                  style={{ 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    color: '#bbf7d0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <PlusSquare size={24} style={{ marginBottom: '0.75rem', color: '#4ade80' }} />
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>Pantry Setup</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Reset or add baseline essentials.</div>
                </button>
              </div>
            </div>

            {/* Composition */}
            <div className="card section">
              <div className="section-head">
                <h3 className="section-title">Pantry Composition</h3>
              </div>

              <div className="bars">
                {topComposition.length ? (
                  topComposition.map((c) => (
                    <div className="bar-row" key={c.category}>
                      <div className="bar-label">{c.category}</div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.max(0, Math.min(100, c.percent))}%` }}
                        />
                      </div>
                      <div className="bar-value">{c.percent}%</div>
                    </div>
                  ))
                ) : (
                  <div className="bar-row">
                    <div className="bar-label">No data</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: "0%" }} />
                    </div>
                    <div className="bar-value">0%</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
