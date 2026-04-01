import { useState, useEffect } from "react";
import { 
  ScrollText, 
  Clock,
  User,
  ChefHat
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import PageSkeleton from "../components/PageSkeleton";
import { getAdminLogsApi } from "../api/api";
import type { AdminCookingLog } from "../api/api";
import "../styles/admin.css";

export default function AdminLogs() {
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
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      {loading && logs.length === 0 ? (
        <PageSkeleton cards={5} />
      ) : (
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
      )}
    </DashboardLayout>
  );
}
