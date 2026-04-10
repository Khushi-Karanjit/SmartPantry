import { motion } from "framer-motion";

export default function StatCard(props: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card relative overflow-hidden group"
    >
      {/* Decorative Glow */}
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
      
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{props.title}</p>
          <p className="text-3xl font-black text-white tracking-tight">{props.value}</p>
          <p className="text-sm text-slate-400 font-medium">{props.sub}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]">
          {props.icon}
        </div>
      </div>
      
      {/* High-tech bottom line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary group-hover:w-full transition-all duration-500" />
    </motion.div>
  );
}
