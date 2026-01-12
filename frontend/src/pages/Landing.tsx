import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8, color: "#1c1c1c" }}>Welcome to SmartPantry</h1>
      <p style={{ color: "#5f5f5f", marginBottom: 18 }}>
        Manage ingredients, plan meals, and keep your kitchen organized.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/register" style={btnPrimary}>Create Account</Link>
        <Link to="/login" style={btnGhost}>Sign In</Link>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  background: "#93a676",
  color: "white",
  textDecoration: "none",
  fontWeight: 600,
};

const btnGhost: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  background: "transparent",
  border: "1px solid rgba(0,0,0,0.12)",
  color: "#2b2b2b",
  textDecoration: "none",
  fontWeight: 600,
};
