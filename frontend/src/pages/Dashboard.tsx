import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";


export default function Dashboard() {
  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      {/* Top Stats */}
      <div className="grid-3">
        <StatCard
  title="Pantry Status"
  value="42 Items"
  sub="92% capacity utilized"
  icon={<CheckCircle2 size={18} />}
/>

<StatCard
  title="Expiring Soon"
  value="5 Items"
  sub="Needs attention within 48h"
  icon={<AlertTriangle size={18} />}
/>

<StatCard
  title="Today's Meals"
  value="3 Planned"
  sub="Breakfast, Lunch, Dinner"
  icon={<Clock size={18} />}
/>

      </div>

      {/* Bottom sections */}
      <div className="grid-2">
        {/* Alerts */}
        <div className="card section">
          <div className="section-head">
            <h3 className="section-title">Reminders & Alerts</h3>
            <a
              className="section-link"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              View All
            </a>
          </div>

          <div className="alerts">
            <div className="alert red">
              <div className="alert-left">
                <div className="pill">⚠</div>
                <div className="alert-text">Chicken Breast expired yesterday</div>
              </div>
              <div className="chev">›</div>
            </div>

            <div className="alert yellow">
              <div className="alert-left">
                <div className="pill">⏳</div>
                <div className="alert-text">Fresh Spinach expires in 2 days</div>
              </div>
              <div className="chev">›</div>
            </div>

            <div className="alert blue">
              <div className="alert-left">
                <div className="pill">✓</div>
                <div className="alert-text">Almond Milk is running low (1L left)</div>
              </div>
              <div className="chev">›</div>
            </div>
          </div>
        </div>

        {/* Composition */}
        <div className="card section">
          <div className="section-head">
            <h3 className="section-title">Pantry Composition</h3>
          </div>

          <div className="bars">
            <div className="bar-row">
              <div style={{ width: 72 }}>Grains</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: "40%" }} />
              </div>
              <div style={{ width: 36, textAlign: "right" }}>40%</div>
            </div>

            <div className="bar-row">
              <div style={{ width: 72 }}>Dairy</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: "25%" }} />
              </div>
              <div style={{ width: 36, textAlign: "right" }}>25%</div>
            </div>

            <div className="bar-row">
              <div style={{ width: 72 }}>Produce</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: "20%" }} />
              </div>
              <div style={{ width: 36, textAlign: "right" }}>20%</div>
            </div>

            <div className="bar-row">
              <div style={{ width: 72 }}>Protein</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: "15%" }} />
              </div>
              <div style={{ width: 36, textAlign: "right" }}>15%</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
