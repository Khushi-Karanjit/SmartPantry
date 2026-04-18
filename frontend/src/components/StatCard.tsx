import { motion } from "framer-motion";

export default function StatCard(props: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  variant?: "primary" | "warning" | "danger" | "success";
}) {
  const variant = props.variant || "primary";

  const variants = {
    primary: "bg-blue-600",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    success: "bg-emerald-500",
  };

  const bgVariants = {
    primary: "bg-blue-500/10 text-blue-600",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-red-500/10 text-red-600",
    success: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card relative overflow-hidden group"
    >
      {/* Decorative Glow */}
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${variants[variant]}`} />
      
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{props.title}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{props.value}</p>
          <p className="text-sm text-slate-500 font-medium">{props.sub}</p>
        </div>
        <div className={`p-3 rounded-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.02)] ${bgVariants[variant]}`}>
          {props.icon}
        </div>
      </div>
      
      {/* High-tech bottom line */}
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full ${variants[variant]}`} />
    </motion.div>
  );
}
