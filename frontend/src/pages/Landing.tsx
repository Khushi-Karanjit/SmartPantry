import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ChevronRight, Zap, Target, CheckCircle } from "lucide-react";

export default function Landing() {
  const { scrollY } = useScroll();
  
  // Create a buttery smooth spring on the scroll position
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 40,
    damping: 15,
    mass: 0.2
  });

  // Vegetable 1 (Top Left Broccoli) -> Drifting UP/LEFT, fading, spinning
  const y1 = useTransform(smoothScrollY, [0, 1500], [0, -500]);
  const x1 = useTransform(smoothScrollY, [0, 1500], [0, -250]);
  const rotate1 = useTransform(smoothScrollY, [0, 1500], [25, -90]);
  const opacity1 = useTransform(smoothScrollY, [0, 1200], [1, 0]);

  // Vegetable 2 (Top Right Carrot) -> Drifting DOWN/RIGHT, fading, spinning
  const y2 = useTransform(smoothScrollY, [0, 1500], [0, 600]);
  const x2 = useTransform(smoothScrollY, [0, 1500], [0, 300]);
  const rotate2 = useTransform(smoothScrollY, [0, 1500], [-12, 110]);
  const opacity2 = useTransform(smoothScrollY, [0, 1200], [1, 0]);

  // Vegetable 3 (Bottom Left Tomato) -> Shooting UP/RIGHT, fading, spinning fast
  const y3 = useTransform(smoothScrollY, [0, 1500], [0, -700]);
  const x3 = useTransform(smoothScrollY, [0, 1500], [0, 350]);
  const rotate3 = useTransform(smoothScrollY, [0, 1500], [45, 220]);
  const opacity3 = useTransform(smoothScrollY, [0, 1000], [1, 0]);

  // Vegetable 4 (Bottom Right Broccoli) -> Drifting DOWN/LEFT subtly, fading
  const y4 = useTransform(smoothScrollY, [0, 1500], [0, 400]);
  const x4 = useTransform(smoothScrollY, [0, 1500], [0, -200]);
  const rotate4 = useTransform(smoothScrollY, [0, 1500], [-45, -160]);
  const opacity4 = useTransform(smoothScrollY, [0, 1200], [1, 0]);

  // Vegetable 5 (Middle Left Onion)
  const y5 = useTransform(smoothScrollY, [0, 1500], [0, 500]);
  const x5 = useTransform(smoothScrollY, [0, 1500], [0, -400]);
  const rotate5 = useTransform(smoothScrollY, [0, 1500], [0, -180]);
  const opacity5 = useTransform(smoothScrollY, [0, 1200], [1, 0]);

  // Vegetable 6 (Bottom Middle Garlic)
  const y6 = useTransform(smoothScrollY, [0, 1500], [0, -300]);
  const x6 = useTransform(smoothScrollY, [0, 1500], [0, 250]);
  const rotate6 = useTransform(smoothScrollY, [0, 1500], [15, 90]);
  const opacity6 = useTransform(smoothScrollY, [0, 900], [1, 0]);

  // Vegetable 7 (Center Right Tomato - Behind Title)
  const y7 = useTransform(smoothScrollY, [0, 1500], [0, -450]);
  const x7 = useTransform(smoothScrollY, [0, 1500], [0, -100]);
  const rotate7 = useTransform(smoothScrollY, [0, 1500], [60, -45]);
  const opacity7 = useTransform(smoothScrollY, [0, 800], [1, 0]);

  // Vegetable 8 (Center Left Carrot - Behind Title)
  const y8 = useTransform(smoothScrollY, [0, 1500], [0, 350]);
  const x8 = useTransform(smoothScrollY, [0, 1500], [0, 150]);
  const rotate8 = useTransform(smoothScrollY, [0, 1500], [-30, 80]);
  const opacity8 = useTransform(smoothScrollY, [0, 800], [1, 0]);

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      } 
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  } as const;

  return (
    <div className="relative min-h-screen bg-white text-slate-900">
      {/* Subtle Minimalist Background Decorations */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-multiply opacity-[0.40]">
         <motion.img style={{ y: y1, x: x1, rotate: rotate1, opacity: opacity1, scaleX: -1, filter: 'contrast(1.1) brightness(1.05)' }} src="/assets/broccoli.png" alt="" className="absolute top-[10%] left-[8%] sm:left-[15%] w-64 h-auto blur-[1px]" />
         <motion.img style={{ y: y2, x: x2, rotate: rotate2, opacity: opacity2, filter: 'contrast(1.1) brightness(1.05)' }} src="/assets/carrot.png" alt="" className="absolute top-[25%] right-[5%] sm:right-[10%] w-72 h-auto blur-[1px]" />
         <motion.img style={{ y: y3, x: x3, rotate: rotate3, opacity: opacity3, filter: 'contrast(1.1) brightness(1.05)' }} src="/assets/onion.png" alt="" className="absolute top-[50%] left-[20%] sm:left-[30%] w-48 h-auto" />
         <motion.img style={{ y: y4, x: x4, rotate: rotate4, opacity: opacity4, filter: 'contrast(1.1) brightness(1.05)' }} src="/assets/eggplant.png" alt="" className="absolute bottom-[25%] right-[15%] sm:right-[25%] w-64 h-auto blur-[2px]" />
         <motion.img style={{ y: y5, x: x5, rotate: rotate5, opacity: opacity5, filter: 'contrast(1.1) brightness(1.05)' }} src="/assets/bellpepper.png" alt="" className="absolute top-[65%] left-[5%] sm:left-[15%] w-56 h-auto blur-[1px]" />
         <motion.img style={{ y: y6, x: x6, rotate: rotate6, opacity: opacity6, filter: 'contrast(1.1) brightness(1.05)' }} src="/assets/garlic.png" alt="" className="absolute bottom-[5%] right-[30%] w-40 h-auto" />
         <motion.img style={{ y: y7, x: x7, rotate: rotate7, opacity: opacity7, filter: 'contrast(1.1) brightness(1.05)' }} src="/assets/tomato.png" alt="" className="absolute top-[25%] right-[25%] sm:right-[35%] w-56 h-auto blur-[2px]" />
         <motion.img style={{ y: y8, x: x8, rotate: rotate8, opacity: opacity8, filter: 'contrast(1.1) brightness(1.05)' }} src="/assets/carrot.png" alt="" className="absolute top-[40%] left-[15%] sm:left-[38%] w-48 h-auto blur-[1px]" />
      </div>

      {/* Main Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* HERO SECTION */}
        <div className="flex flex-col items-center justify-center min-h-screen text-center py-20 relative">
          <motion.div 
            variants={containerVars}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            {/* Hero Header */}
            <div className="space-y-4">
              <motion.span 
                variants={itemVars}
                className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs tracking-widest uppercase mb-4 rounded-full"
              >
                The Smart Kitchen Assistant
              </motion.span>
              
              <motion.h1 
                variants={itemVars}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900"
              >
                Organize Your <span className="text-blue-600">Kitchen</span>,<br /> 
                Simplify Your <span className="text-blue-600">Cooking</span>.
              </motion.h1>
              
              <motion.p 
                variants={itemVars}
                className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
              >
                Use smart tools to manage your food, create recipes easily, and keep your kitchen organized.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVars}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link to="/register" className="btn-futuristic group flex items-center gap-2 text-base px-10 py-4">
                Get Started Free <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="btn-ghost-futuristic text-base px-10 py-4">
                Sign In
              </Link>
            </motion.div>

            {/* Floating Quick Feature Cards */}
            <motion.div 
              variants={itemVars}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-8 sm:pt-12"
            >
              <div className="bg-[#FAFDFF] border border-slate-200 p-6 sm:p-8 space-y-4 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center text-blue-600">
                  <Zap size={24} />
                </div>
                <h3 className="text-lg font-bold">Videos to Recipes</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Turn your favorite cooking videos into easy-to-follow recipes.</p>
              </div>
              
              <div className="bg-[#FAFDFF] border border-slate-200 p-6 sm:p-8 space-y-4 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center text-blue-600">
                  <Target size={24} />
                </div>
                <h3 className="text-lg font-bold">Accurate Measures</h3>
                <p className="text-slate-600 text-sm leading-relaxed">We help you use the right amounts for every ingredient.</p>
              </div>

              <div className="bg-[#FAFDFF] border border-slate-200 p-6 sm:p-8 space-y-4 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckCircle size={24} />
                </div>
                <h3 className="text-lg font-bold">Kitchen Stock</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Keep track of everything you have in your kitchen.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* WHY SMARTPANTRY? - DEEP DIVE SECTION */}
        <section className="py-24 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Why choose <span className="text-blue-600">SmartPantry?</span></h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">It's more than just a list—it's a helpful assistant for your home.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="space-y-8">
              <div className="bg-slate-50 p-10 space-y-6 rounded-3xl border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900">Easy Recipe Steps</h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  Our app looks at cooking videos and gives you the exact steps and ingredients you need. No more pausing and re-watching!
                </p>
                <ul className="space-y-3 text-slate-500 text-sm">
                  <li className="flex items-center gap-2 font-semibold">• Quick video reading</li>
                  <li className="flex items-center gap-2 font-semibold">• Simple instructions</li>
                  <li className="flex items-center gap-2 font-semibold">• One-click recipes</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-10 space-y-6 rounded-3xl border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900">Right Measurements</h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  We make sure your recipes make sense. No more confusing amounts—just simple, clear units that anyone can follow.
                </p>
                <ul className="space-y-3 text-slate-500 text-sm">
                  <li className="flex items-center gap-2 font-semibold">• Standard measurements</li>
                  <li className="flex items-center gap-2 font-semibold">• Safe quantity checks</li>
                  <li className="flex items-center gap-2 font-semibold">• Clear cooking guides</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-600 rounded-3xl flex items-center justify-center p-12 text-center text-white">
              <div className="space-y-8 max-w-sm">
                <h4 className="text-3xl font-bold">"The easiest way to decide what's for dinner."</h4>
                <div className="w-16 h-1 bg-white/20 mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 bg-slate-50 rounded-[3rem] px-8 md:px-20 border border-slate-200">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#FAFDFF] border border-slate-200 mx-auto rounded-full flex items-center justify-center text-xl font-bold text-blue-600 shadow-md">1</div>
                <h4 className="text-lg font-bold">Add a Video</h4>
                <p className="text-slate-500 text-sm">Paste any cooking video link or add your favorite recipes.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#FAFDFF] border border-slate-200 mx-auto rounded-full flex items-center justify-center text-xl font-bold text-blue-600 shadow-md">2</div>
                <h4 className="text-lg font-bold">We Organize It</h4>
                <p className="text-slate-500 text-sm">We clean up and organize the recipe for you instantly.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#FAFDFF] border border-slate-200 mx-auto rounded-full flex items-center justify-center text-xl font-bold text-blue-600 shadow-md">3</div>
                <h4 className="text-lg font-bold">Cook & Save</h4>
                <p className="text-slate-500 text-sm">Track what you use and save your favorites.</p>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION STATMENT */}
        <section className="py-20 text-center max-w-4xl mx-auto space-y-8">
           <h3 className="text-3xl md:text-4xl font-bold leading-tight text-slate-800">"Making it simple to get dinner on the table."</h3>
           <div className="pt-4">
              <Link to="/register" className="btn-futuristic inline-block text-base px-10">Try it for free</Link>
           </div>
        </section>
      </div>
      
      {/* Footer Branding */}
      <footer className="py-12 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
             <div className="text-xl font-bold tracking-tight text-slate-800">Smart<span className="text-blue-600 font-black">Pantry</span></div>
             <p className="text-slate-400 text-sm">The simple way to manage your kitchen.</p>
          </div>
          
          <div className="flex gap-10 text-slate-500 text-sm font-medium">
             <Link to="/login" className="hover:text-blue-600 transition-colors">Sign In</Link>
             <Link to="/register" className="hover:text-blue-600 transition-colors">Get Started</Link>
          </div>

          <div className="text-slate-400 text-xs text-center md:text-right">
            © 2026 SmartPantry Home Systems.<br />
            Simple Kitchen Solutions
          </div>
        </div>
      </footer>
    </div>
  );
}

