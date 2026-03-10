import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getUser, isAuthed } from "../auth/auth";

export default function Navbar() {
  const nav = useNavigate();
  const authed = isAuthed();
  const user = getUser();

  function logout() {
    clearAuth();
    nav("/login");
  }

  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <div style={styles.logo}>SP</div>
        <div>
          <div style={styles.title}>SmartPantry</div>
          <div style={styles.sub}>Simplify your kitchen management</div>
        </div>
      </div>

      <nav style={styles.nav}>
        <Link to="/" style={styles.link}>Home</Link>
        {!authed && <Link to="/login" style={styles.link}>Login</Link>}
        {!authed && <Link to="/register" style={styles.link}>Register</Link>}

        {authed && (
          <>
            <span style={styles.userPill}>Hi, {user?.username ?? "User"}</span>
            <button onClick={logout} style={styles.btn}>Logout</button>
          </>
        )}
      </nav>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    background: "#fbfbf7",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "#93a676",
    display: "grid",
    placeItems: "center",
    color: "white",
    fontSize: 18,
  },
  title: { fontWeight: 700, fontSize: 16, color: "#1c1c1c" },
  sub: { fontSize: 12, color: "#6b6b6b", marginTop: 2 },
  nav: { display: "flex", alignItems: "center", gap: 12 },
  link: { textDecoration: "none", color: "#2b2b2b", fontSize: 14 },
  userPill: {
    fontSize: 13,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(147,166,118,0.18)",
    color: "#2b2b2b",
  },
  btn: {
    border: "none",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: 10,
    background: "#93a676",
    color: "white",
    fontWeight: 600,
  },
};
