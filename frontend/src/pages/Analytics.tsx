import { useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
  AreaChart, Area
} from "recharts";
import { 
  Activity, 
  PieChart as PieIcon, 
  Zap, 
  Target, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Info
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import { getUserAnalyticsApi } from "../api/api";
import type { UserAnalytics } from "../api/api";
import "../styles/Analytics.css";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4"];

export default function Analytics() {
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await getUserAnalyticsApi();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
        <div className="analytics-page loading">
          <div className="spinner"></div>
          <p>Analyzing your kitchen data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  // Calculate today's progress
  const todayStr = new Date().toISOString().split("T")[0];
  const todayData = data.nutritionHistory.find(h => h.date === todayStr) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  const caloriePercent = Math.min(Math.round((todayData.calories / data.targets.calories) * 100), 100);

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="analytics-page">
        <header className="analytics-header">
          <div>
            <h1 className="analytics-title">Nutritional Analytics</h1>
            <p className="analytics-sub">Insight into your pantry health and cooking habits.</p>
          </div>
          <div className="date-badge">
            <Calendar size={16} /> Last 7 Days
          </div>
        </header>

        {/* Top Stats Stats */}
        <div className="stats-grid">
          <div className="stat-card calories">
            <div className="stat-icon"><Zap size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Daily Calories</span>
              <div className="stat-value-group">
                <span className="stat-value">{todayData.calories}</span>
                <span className="stat-target">/ {data.targets.calories} kcal</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${caloriePercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card protein">
             <div className="stat-info">
                <span className="stat-label">Protein</span>
                <span className="stat-value">{todayData.protein}g</span>
                <span className="stat-sub">Target: {data.targets.protein}g</span>
             </div>
             <TrendingUp size={20} className="trend-icon" />
          </div>

          <div className="stat-card carbs">
             <div className="stat-info">
                <span className="stat-label">Carbs</span>
                <span className="stat-value">{todayData.carbs}g</span>
                <span className="stat-sub">Target: {data.targets.carbs}g</span>
             </div>
             <TrendingUp size={20} className="trend-icon" />
          </div>

          <div className="stat-card fat">
             <div className="stat-info">
                <span className="stat-label">Fat</span>
                <span className="stat-value">{todayData.fat}g</span>
                <span className="stat-sub">Target: {data.targets.fat}g</span>
             </div>
             <TrendingUp size={20} className="trend-icon" />
          </div>
        </div>

        <div className="charts-main-grid">
          {/* Pantry Composition */}
          <div className="chart-card large">
            <div className="card-header">
              <h3 className="card-title"><PieIcon size={18} /> Pantry Composition</h3>
              <p className="card-subtitle">Distribution of items by category</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.pantryComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.pantryComposition.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calorie Trend */}
          <div className="chart-card x-large">
            <div className="card-header">
              <h3 className="card-title"><Activity size={18} /> Daily Calorie Intake</h3>
              <p className="card-subtitle">Energy consumed from recorded meals</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.nutritionHistory}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => new Date(str).toLocaleDateString([], { weekday: 'short' })}
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 12}}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b', fontSize: 12}}
                  />
                  <ReTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <ReferenceLine y={data.targets.calories} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'right', value: 'Goal', fill: '#f43f5e', fontSize: 10 }} />
                  <Area type="monotone" dataKey="calories" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="charts-secondary-grid">
           {/* Nutrient Balance */}
           <div className="chart-card">
              <div className="card-header">
                <h3 className="card-title"><Target size={18} /> Nutrient Balance</h3>
                <p className="card-subtitle">Average macros vs daily goals</p>
              </div>
              <div className="chart-container">
                 <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { name: 'Protein', current: todayData.protein, target: data.targets.protein },
                        { name: 'Carbs', current: todayData.carbs, target: data.targets.carbs },
                        { name: 'Fat', current: todayData.fat, target: data.targets.fat },
                      ]}
                      layout="vertical"
                      margin={{ left: 20, right: 30 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontWeight: 600}} />
                      <ReTooltip />
                      <Bar dataKey="current" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                      <Bar dataKey="target" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="info-card">
              <div className="info-icon"><Info size={24} /></div>
              <h4>Smart Tip</h4>
              <p>Based on your current pantry, you have <strong>high protein</strong> ingredients available. Consider making a chicken or bean-based recipe tonight to meet your daily target.</p>
              <button className="info-action">
                View Recommendations <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
