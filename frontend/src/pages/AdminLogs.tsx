import { useState, useEffect } from "react";
import { 
  ScrollText, 
  ArrowLeft,
  Clock,
  User,
  ChefHat
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { getAdminLogsApi } from "../api/api";
import type { AdminCookingLog } from "../api/api";
import "../styles/admin.css";

export default function AdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AdminCookingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAdminLogsApi();
      setLogs(res.logs);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout topbar={() => (
      <div className="topbar">
        <div className="topbar-left">
          <button className="icon-btn" onClick={() => navigate("/admin")}>
            <ArrowLeft size={20} />
          </button>
          <h1>Cooking Activity Logs</h1>
        </div>
      </div>
    )}>
      <div className="admin-page-content">
        <section className="card admin-section">
          <div className="section-head">
            <h3 className="section-title"><ScrollText size={18} /> System-Wide Activities</h3>
          </div>

          {error && <div className="admin-error-banner">{error}</div>}

          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>Activity</div>
              <div>User</div>
              <div>Recipe</div>
              <div style={{ textAlign: 'right' }}>Time</div>
            </div>

            {loading && logs.length === 0 && <div className="admin-loading">Loading history...</div>}
            {!loading && logs.length === 0 && <div className="admin-empty">No activity recorded yet.</div>}

            {logs.map((log) => (
              <div className="admin-row" key={log._id}>
                <div className="cell-icon-wrap">
                  <div className="log-icon-box">
                    <ChefHat size={16} />
                  </div>
                  <span>Cooked</span>
                </div>
                <div className="cell-title">
                  <User size={14} style={{ marginRight: 4 }} />
                  {log.userId?.username || "Deleted User"}
                </div>
                <div>
                  <div className="cell-title">{log.recipeId?.name || "Deleted Recipe"}</div>
                </div>
                <div className="muted" style={{ textAlign: 'right' }}>
                  <Clock size={12} style={{ marginRight: 4 }} />
                  {new Date(log.performedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
