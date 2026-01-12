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

const PRESETS = [
  {
    id: "student",
    title: "Student Essentials",
    desc: "Budget-friendly basics for quick and easy meals.",
    items: ["Pasta", "Rice", "Canned Tomatoes", "Eggs", "+18 more"],
    total: "15 total items",
    icon: Utensils,
  },
  {
    id: "nepali",
    title: "Nepali Kitchen",
    desc: "Traditional staples for authentic Himalayan cooking.",
    items: ["Basmati Rice", "Lentils (Dal)", "Mustard Oil", "Ginger", "+18 more"],
    total: "22 total items",
    icon: Leaf,
  },
  {
    id: "healthy",
    title: "Modern Healthy",
    desc: "Grains, seeds, and plant-based protein foundations.",
    items: ["Quinoa", "Chia Seeds", "Avocado", "Kale", "+14 more"],
    total: "18 total items",
    icon: HeartPulse,
  },
  {
    id: "italian",
    title: "Italian Basics",
    desc: "Mediterranean foundation for pasta and risotto.",
    items: ["Olive Oil", "Parmesan", "Arborio Rice", "Pasta", "+16 more"],
    total: "20 total items",
    icon: Pizza,
  },
];

export default function PantrySetup() {
  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="preset-page">
        {/* Header */}
        <div className="preset-head">
          <h2>Pantry Setup</h2>
          <p>
            Initialize your kitchen with one of our curated baseline presets.
          </p>
        </div>

        {/* Presets */}
        <div className="preset-grid">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.id} className="preset-card">
                <div className="preset-icon">
                  <Icon size={20} />
                </div>

                <h3>{p.title}</h3>
                <p className="preset-desc">{p.desc}</p>

                <div className="preset-tags">
                  {p.items.map((i) => (
                    <span key={i}>{i}</span>
                  ))}
                </div>

                <div className="preset-footer">
                  <span className="preset-total">{p.total}</span>
                  <button className="preset-select">
                    Select Foundation
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="preset-cta">
          <div>
            <h3>Ready to start cooking?</h3>
            <p>
              Selecting a preset will populate your pantry with standard
              quantities. You can adjust everything later.
            </p>
          </div>

          <button className="preset-cta-btn">
            <CheckCircle size={18} />
            Initialize My Pantry
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
