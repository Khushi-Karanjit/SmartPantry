import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { registerApi } from "../api/api";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function Register() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const canSubmit = useMemo(() => {
    const u = username.trim();
    const e = email.trim();
    return (
      u.length >= 3 &&
      isValidEmail(e) &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword &&
      !loading
    );
  }, [username, email, password, confirmPassword, loading]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setErr(null);
    setSuccess(null);

    const u = username.trim();
    const em = email.trim();

    if (u.length < 3) return setErr("Username must be at least 3 characters.");
    if (!isValidEmail(em)) return setErr("Please enter a valid email address.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (confirmPassword.length < 6) return setErr("Confirm password must be at least 6 characters.");
    if (password !== confirmPassword) return setErr("Passwords do not match.");

    setLoading(true);

    try {
      await registerApi({ username: u, email: em, password });
      setSuccess("Account created. Redirecting to login...");
      setTimeout(() => nav("/login?registered=1"), 600);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong";
      setErr(msg);
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
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="pw-wrap">
              <input
                className="pw-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="pw-wrap">
              <input
                className="pw-input"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {err && <div className="err">{err}</div>}
          {success && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#2b2b2b" }}>
              {success}
            </div>
          )}

         
          <button className="primary-btn" type="submit">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="footer-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>

        
      </div>
    </div>
  );
}
