import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import {
  Leaf,
  Utensils,
  HeartPulse,
  Pizza,
  CheckCircle,
} from "lucide-react";
import "../styles/PantrySetup.css";

type PresetItem = {
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
};

type Preset = {
  _id?: string;
  key: string;
  title: string;
  description?: string;
  items: PresetItem[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function getIconByKey(key: string) {
  switch (key) {
    case "student":
      return Utensils;
    case "nepali":
      return Leaf;
    case "healthy":
      return HeartPulse;
    case "italian":
      return Pizza;
    default:
      return Utensils;
  }
}

export default function PantrySetup() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [initializing, setInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // 1) Fetch presets from backend (MongoDB)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token"); // CHANGE if your token key differs
        if (!token) {
          setError("No auth token found. Please login again.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/pantry/presets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.message || "Failed to load presets.");
          setLoading(false);
          return;
        }

        setPresets(data.presets || []);
      } catch {
        setError("Network error while loading presets.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Initialize pantry using selected preset
  const initializePantry = async () => {
    try {
      setError("");

      if (!selectedKey) {
        setError("Please select a foundation preset first.");
        return;
      }

      const token = localStorage.getItem("token"); // CHANGE if your token key differs
      if (!token) {
        setError("No auth token found. Please login again.");
        return;
      }

      setInitializing(true);

      const res = await fetch(`${API_BASE}/api/pantry/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ presetKey: selectedKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        // backend sends 409 if already initialized, 404 if preset not found, etc.
        setError(data?.message || "Failed to initialize pantry.");
        return;
      }

      // Success: you can redirect to dashboard/pantry page if you want
      // window.location.href = "/dashboard"; // optional
      setError(`✅ Initialized ${data.count || 0} items successfully.`);
    } catch {
      setError("Network error while initializing pantry.");
    } finally {
      setInitializing(false);
    }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="preset-page">
        {/* Header */}
        <div className="preset-head">
          <h2>Pantry Setup</h2>
          <p>Initialize your kitchen with one of our curated baseline presets.</p>
        </div>

        {/* Status */}
        {loading && <p style={{ opacity: 0.7 }}>Loading presets...</p>}
        {error && <p style={{ opacity: 0.9 }}>{error}</p>}

        {/* Presets */}
        {!loading && (
          <div className="preset-grid">
            {presets.map((p) => {
              const Icon = getIconByKey(p.key);
              const preview = (p.items || []).slice(0, 4).map((x) => x.name);
              const more = (p.items?.length || 0) > 4 ? `+${(p.items.length - 4)} more` : "";

              return (
                <div
                  key={p.key}
                  className={`preset-card ${selectedKey === p.key ? "selected" : ""}`}
                  onClick={() => setSelectedKey(p.key)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="preset-icon">
                    <Icon size={20} />
                  </div>

                  <h3>{p.title}</h3>
                  <p className="preset-desc">{p.description || ""}</p>

                  <div className="preset-tags">
                    {preview.map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                    {more && <span key={more}>{more}</span>}
                  </div>

                  <div className="preset-footer">
                    <span className="preset-total">{p.items?.length || 0} total items</span>
                    <button
                      className="preset-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedKey(p.key);
                      }}
                    >
                      {selectedKey === p.key ? "Selected" : "Select Foundation"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="preset-cta">
          <div>
            <h3>Ready to start cooking?</h3>
            <p>
              Selecting a preset will populate your pantry with standard quantities.
              You can adjust everything later.
            </p>
          </div>

          <button
            className="preset-cta-btn"
            onClick={initializePantry}
            disabled={initializing || !selectedKey}
          >
            <CheckCircle size={18} />
            {initializing ? "Initializing..." : "Initialize My Pantry"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
