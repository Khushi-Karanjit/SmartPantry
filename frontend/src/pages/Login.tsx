import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Lock, User as UserIcon, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { loginApi } from "../api/api";
import { saveAuth } from "../auth/auth";

export default function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get("registered") === "1") {
      setNote("Account created successfully. Please log in.");
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
        throw new Error("Please enter your username and password.");
      }

      const res = await loginApi({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });

      saveAuth(res.token, res.user);

      const nextPath = res.user.role === "admin" ? "/admin" : "/home";
      nav(nextPath);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-slate-50 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#FAFDFF] border border-slate-200 rounded-[2.5rem] p-10 space-y-8 shadow-2xl shadow-blue-900/5">
          {/* BRANDING */}
          <div className="text-center space-y-2">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-blue-200 mb-4"
            >
              SP
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
               Smart<span className="text-blue-600">Pantry</span>
            </h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
              Log in to your account
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Username or Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-blue-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-xs font-bold uppercase tracking-widest">
              <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            {note && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium">
                {note}
              </div>
            )}
            
            {err && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
                {err}
              </div>
            )}

            <button 
              className="bg-slate-900 text-white w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg" 
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Log In <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-slate-400 text-sm font-medium">
              Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors ml-1">Sign up</Link>
            </p>
          </div>
        </div>

        {/* FOOTER BADGE */}
        <div className="mt-8 flex justify-center opacity-40">
          <div className="flex items-center gap-2 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} /> Secure login active
          </div>
        </div>
      </motion.div>
    </div>
  );
}
