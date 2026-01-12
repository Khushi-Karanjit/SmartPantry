import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/auth.css";
import { loginApi } from "../api/api";
import { saveAuth } from "../auth/auth";

export default function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get("registered") === "1") {
      setNote("Account created. Please sign in.");
    }
  }, [params]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setErr(null);
    setNote(null);
    setLoading(true);

    try {
      if (!usernameOrEmail.trim() || !password) {
        throw new Error("Please enter your email/username and password.");
      }

      const res = await loginApi({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });

      // Save token + user to localStorage
      saveAuth(res.token, res.user);

      // Go to protected home
      nav("/home");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">🌿</div>
          <h1 className="auth-title">SmartPantry</h1>
          <p className="auth-subtitle">Sign in to continue</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email or Username</label>
            <input
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="khushi@gmail.com or khushi"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="row">
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
              <input type="checkbox" style={{ width: 14, height: 14 }} />
              Remember me
            </label>

            <a href="#" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          {note && <div style={{ marginTop: 10, fontSize: 13, color: "#2b2b2b" }}>{note}</div>}
          {err && <div className="err">{err}</div>}

          <button className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="footer-link">
          Don&apos;t have an account? <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
