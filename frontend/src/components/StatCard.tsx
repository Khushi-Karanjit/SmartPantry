import "../styles/Dashboard.css";

export default function StatCard(props: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card stat-card">
      <div>
        <p className="stat-title">{props.title}</p>
        <p className="stat-value">{props.value}</p>
        <p className="stat-sub">{props.sub}</p>
      </div>
      <div className="badge">{props.icon}</div>
    </div>
  );
}
