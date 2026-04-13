import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout(props: {
  topbar: (openMenu: () => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const openMenu = () => setOpen(true);
  const closeMenu = () => setOpen(false);

  // Parallax calculations
  const { scrollY } = useScroll();
  
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 40,
    damping: 15,
    mass: 0.2
  });

  const y1 = useTransform(smoothScrollY, [0, 1000], [0, -300]);
  const x1 = useTransform(smoothScrollY, [0, 1000], [0, -150]);
  const rotate1 = useTransform(smoothScrollY, [0, 1000], [12, -45]);
  const opacity1 = useTransform(smoothScrollY, [0, 800], [1, 0]);

  const y2 = useTransform(smoothScrollY, [0, 1000], [0, 400]);
  const x2 = useTransform(smoothScrollY, [0, 1000], [0, 200]);
  const rotate2 = useTransform(smoothScrollY, [0, 1000], [-12, 90]);
  const opacity2 = useTransform(smoothScrollY, [0, 800], [1, 0]);

  const y3 = useTransform(smoothScrollY, [0, 1000], [0, -400]);
  const x3 = useTransform(smoothScrollY, [0, 1000], [0, 250]);
  const rotate3 = useTransform(smoothScrollY, [0, 1000], [45, 180]);
  const opacity3 = useTransform(smoothScrollY, [0, 700], [1, 0]);

  const y4 = useTransform(smoothScrollY, [0, 1000], [0, 250]);
  const x4 = useTransform(smoothScrollY, [0, 1000], [0, -150]);
  const rotate4 = useTransform(smoothScrollY, [0, 1000], [-45, -120]);
  const opacity4 = useTransform(smoothScrollY, [0, 800], [1, 0]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-72 h-screen fixed left-0 top-0 z-50 bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <Sidebar variant="desktop" />
      </aside>

      {/* Subtle Minimalist Background Decorations (taking over from the old 3D scene) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden mix-blend-multiply opacity-[0.15] grayscale">
         <motion.img style={{ y: y1, x: x1, rotate: rotate1, opacity: opacity1, scaleX: -1 }} src="/assets/broccoli.png" alt="" className="absolute top-[15%] left-[25%] sm:left-[35%] lg:left-[45%] w-64 h-auto blur-[1px]" />
         <motion.img style={{ y: y2, x: x2, rotate: rotate2, opacity: opacity2 }} src="/assets/carrot.png" alt="" className="absolute bottom-[20%] right-[20%] sm:right-[30%] lg:right-[25%] w-72 h-auto blur-[2px]" />
         <motion.img style={{ y: y3, x: x3, rotate: rotate3, opacity: opacity3 }} src="/assets/tomato.png" alt="" className="absolute top-[30%] right-[10%] sm:right-[20%] lg:right-[15%] w-48 h-auto blur-[1px]" />
         <motion.img style={{ y: y4, x: x4, rotate: rotate4, opacity: opacity4 }} src="/assets/tomato.png" alt="" className="absolute bottom-[15%] left-[15%] sm:left-[25%] lg:left-[35%] w-56 h-auto blur-[2px]" />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-80 lg:hidden"
            >
              <Sidebar variant="drawer" onNavigate={closeMenu} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen min-w-0 lg:ml-72 relative z-10 transition-all ease-in-out duration-300 overflow-x-hidden">
        {props.topbar(openMenu)}
        
        <main className="flex-1 px-4 py-8 lg:px-10 max-w-[1600px] mx-auto w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {props.children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

