import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, User as UserIcon, Mail, Lock, ShieldCheck } from "lucide-react";
import { registerApi } from "../api/api";

export default function Register() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!username.trim() || !email.trim() || !password) {
        throw new Error("Please fill in all fields.");
      }

      await registerApi({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => nav("/login?registered=1"), 800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create account. Please try again.");
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
              Create <span className="text-blue-600">Account</span>
            </h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
              Join SmartPantry today
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {success && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium">
                {success}
              </div>
            )}
            
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
                {error}
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
                  Sign Up <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-slate-400 text-sm font-medium">
              Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors ml-1">Log in</Link>
            </p>
          </div>
        </div>

        {/* FOOTER BADGE */}
        <div className="mt-8 flex justify-center opacity-40">
          <div className="flex items-center gap-2 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} /> Secure registration
          </div>
        </div>
      </motion.div>
    </div>
  );
}

