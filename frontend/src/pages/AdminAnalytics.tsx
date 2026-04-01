import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  PieChart as PieChartIcon
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import PageSkeleton from "../components/PageSkeleton";
import { getAdminAnalyticsApi } from "../api/api";
import type { AdminAnalytics as AdminAnalyticsType } from "../api/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import "../styles/admin.css";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getAdminAnalyticsApi();
      setData(res);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      {loading ? (
        <PageSkeleton cards={2} />
      ) : (
        <div className="admin-page-content">
          {error && <div className="admin-error-banner">{error}</div>}
          <div className="analytics-grid">
            <section className="card admin-section">
              <div className="section-head">
                <h3 className="section-title"><TrendingUp size={18} /> Most Cooked Recipes</h3>
              </div>
              <div className="chart-container" style={{ height: 300, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.mostCooked || []}>
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(data?.mostCooked || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="analytics-list">
                {(data?.mostCooked || []).map((item, idx) => (
                  <div className="analytics-list-item" key={idx}>
                    <span className="dot" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="label">{item.name}</span>
                    <span className="value">{item.count} cooks</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card admin-section">
              <div className="section-head">
                <h3 className="section-title"><PieChartIcon size={18} /> Ingredient Popularity</h3>
              </div>
              <div className="chart-container" style={{ height: 300, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={data?.ingredientStats || []}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" hide />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {(data?.ingredientStats || []).map((_, index) => (
                        <Cell key={`cell-ing-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="analytics-list">
                {(data?.ingredientStats || []).map((item, idx) => (
                  <div className="analytics-list-item" key={idx}>
                    <span className="dot" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }}></span>
                    <span className="label">{item.name}</span>
                    <span className="value">{item.count} usages</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
