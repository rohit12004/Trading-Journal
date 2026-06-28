import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { 
  ArrowRight, 
  Play, 
  Check, 
  BrainCircuit, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  Calendar, 
  Sparkles 
} from "lucide-react";

const Landing = () => {
  const { user } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  // Track scroll position for sticky transparent navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside to close features dropdown
  useEffect(() => {
    if (!featuresOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".features-dropdown-container")) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [featuresOpen]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-slate-100 font-sans selection:bg-violet-500 selection:text-white relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[600px] right-1/4 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Sticky transparent Navbar (Full Width) */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-neutral-950/85 backdrop-blur-md border-b border-white/5 py-4 shadow-xl" 
            : "bg-transparent border-b border-transparent py-6"
        }`}
      >
        <div className="w-full px-6 md:px-12 lg:px-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Custom orange sun logo */}
            <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="28" stroke="#E05638" strokeWidth="4.5" strokeDasharray="6 4" />
              <path d="M35 65C35 50 42 40 50 40C58 40 65 50 65 65" stroke="#E05638" strokeWidth="6" strokeLinecap="round" />
              <path d="M42 65C42 55 46 50 50 50C54 50 58 55 58 65" stroke="#E05638" strokeWidth="4" strokeLinecap="round" />
              <circle cx="50" cy="27" r="5" fill="#E05638" />
            </svg>
            <span className="text-lg font-bold tracking-tight text-white">QuantCoach AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-neutral-400">
            {/* Features Dropdown */}
            <div className="relative features-dropdown-container">
              <button 
                onClick={() => setFeaturesOpen(!featuresOpen)}
                className="hover:text-white transition-colors flex items-center gap-1 focus:outline-none"
              >
                Features
                <svg className={`w-3.5 h-3.5 transition-transform ${featuresOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3.5 transition-all duration-200 origin-top ${
                featuresOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}>
                {/* Manual Logger */}
                <div className="flex gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Manual Trade Logger</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">Log Stocks, Options, &amp; Futures with customized strategy tags.</p>
                  </div>
                </div>
                {/* Statement Importer */}
                <div className="flex gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Statement Importer</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">Bulk upload F&amp;O statements from brokers like Groww.</p>
                  </div>
                </div>
                {/* Dashboard Analytics */}
                <div className="flex gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Interactive Dashboard</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">Drill down on Net P&amp;L, Win Rate, and Account Balances.</p>
                  </div>
                </div>
                {/* Trading Calendar */}
                <div className="flex gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Trading Calendar</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">Track your daily green and red sessions in a color-coded grid.</p>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-violet-500/20 transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-neutral-400 hover:text-white text-sm font-semibold transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-violet-500/20 transition-all"
                >
                  Start Now
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (Full Width Grid) */}
      <section className="w-full px-6 md:px-12 lg:px-20 pt-32 pb-20 lg:pt-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-5 space-y-6 text-left">
            {/* Version Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Introducing QuantCoach AI v1.0</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Meet Your AI <br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-300 bg-clip-text text-transparent">
                Trading Partner.
              </span>
            </h1>
            
            <p className="text-neutral-400 text-base md:text-lg leading-relaxed max-w-xl">
              The trading journal that knows your metrics, logs executions automatically, and builds your mental game plan while you focus on the next session.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-500/20 transition-all flex items-center gap-2 transform active:scale-95"
              >
                Start Now
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
            </div>

            {/* Tags (TradeZella style) */}
            <div className="pt-6 space-y-2.5">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Everything in one place</p>
              <div className="flex flex-wrap gap-2 max-w-xl">
                {[
                  "Automated Journaling",
                  "AI Insights",
                  "Drawdown Guard",
                  "Backtesting",
                  "Strategy Tracker",
                  "Prop Firm Sync"
                ].map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs px-3.5 py-1 bg-white/5 border border-white/5 hover:border-violet-500/30 rounded-full text-neutral-300 transition-colors"
                  >
                    • {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Right: Live Interactive Mockup (Stretches to fill space) */}
          <div id="mockup" className="lg:col-span-7 relative w-full flex justify-center lg:justify-end">
            
            {/* Visual glow backdrop */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-2xl opacity-15 pointer-events-none"></div>

            {/* Mock Dashboard wrapper */}
            <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative select-none">
              
              {/* Mock Window Bar */}
              <div className="bg-neutral-900/60 border-b border-white/5 px-4 py-3 flex justify-between items-center">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono tracking-wider">quantcoach.ai/dashboard</span>
                <div className="w-4 h-4"></div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-4 bg-neutral-950/40 space-y-4">
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-left">
                    <span className="text-[9px] text-neutral-500 font-bold uppercase">Net P&L</span>
                    <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">+₹1,07,183.75</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-left">
                    <span className="text-[9px] text-neutral-500 font-bold uppercase">Win Rate</span>
                    <p className="text-base font-bold text-violet-400 font-mono mt-0.5">68.2%</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-left">
                    <span className="text-[9px] text-neutral-500 font-bold uppercase">Profit Factor</span>
                    <p className="text-base font-bold text-neutral-300 font-mono mt-0.5">2.41</p>
                  </div>
                </div>

                {/* Calendar grid mock */}
                <div className="border border-white/5 rounded-lg p-4 bg-neutral-950/70">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-neutral-200">June 2026</span>
                    <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">Monthly Stats</span>
                  </div>
                  
                  {/* Calendar Matrix */}
                  <div className="grid grid-cols-5 gap-2.5 text-center">
                    {/* Row 1 */}
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">01</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">+₹1,150</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">02</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">+₹3,025</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">03</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">+₹1,050</span>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">04</span>
                      <span className="text-red-400 font-bold font-mono text-xs">-₹350</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">05</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">+₹5,350</span>
                    </div>
                    
                    {/* Row 2 */}
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">08</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">+₹600</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">09</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">+₹1,850</span>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">10</span>
                      <span className="text-red-400 font-bold font-mono text-xs">-₹638</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">11</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">+₹1,180</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-lg text-[10px] flex flex-col justify-between h-14">
                      <span className="text-neutral-500 text-left font-mono">12</span>
                      <span className="text-emerald-400 font-bold font-mono text-xs">+₹113</span>
                    </div>
                  </div>
                </div>

                {/* AI Advisor Overlay Card (Floating effect) */}
                <div className="absolute top-12 right-4 lg:right-[-25px] bg-neutral-900 border border-white/10 rounded-xl p-4 w-80 shadow-2xl space-y-3 transform hover:-translate-y-1 transition-transform">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
                        <BrainCircuit className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white">QuantCoach AI Advisor</span>
                    </div>
                    <span className="text-[8px] bg-green-500/15 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold font-mono">SUGGESTION</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-400 font-mono">+₹2,140 Potential Savings</p>
                    <p className="text-[10px] text-neutral-400 leading-normal text-left">
                      Your gap-fill and morning breakout trades account for 127% of your profits. However, you are losing money on fading early morning spikes. Stop fading morning spikes to save ₹2,140.
                    </p>
                  </div>
                </div>

                {/* Log list sync alert */}
                <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg p-2.5 px-3 text-[10px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>AUTO-SYNC SUCCESSFUL</span>
                  </div>
                  <span className="font-mono text-neutral-500">12 trades pulled from Interactive Brokers</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Feature Section (Full Width) */}
      <section id="features" className="w-full px-6 md:px-12 lg:px-20 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">Built to Win</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">The Toolkit to Eliminate Emotional Trades</h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
            Stop trading on gut feelings. Our suite of AI insights logs execution parameters and reviews sessions automatically so you can build systematic confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-left hover:border-violet-500/20 transition-colors space-y-4">
            <div className="w-12 h-12 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">AI Coach Insights</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Finds behavioral patterns like FOMO, revenge trading, and gridlock over-sizing by scanning your trade notes and time entries.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-left hover:border-indigo-500/20 transition-colors space-y-4">
            <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">P&L Analytics</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Drill down on your win rates by strategy, asset type, execution duration, and daily schedules. Fully understand where you generate yield.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-left hover:border-red-500/20 transition-colors space-y-4">
            <div className="w-12 h-12 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Drawdown Protection</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Set capital protection limits. Our system sends real-time alarms if you exceed daily risk thresholds, guarding your account.
            </p>
          </div>

        </div>
      </section>

      {/* Pricing Section Removed */}

      {/* Footer (Full Width) */}
      <footer className="w-full py-12 text-center text-xs text-neutral-600 border-t border-white/5 bg-neutral-950">
        <div className="w-full px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="28" stroke="#E05638" strokeWidth="4.5" strokeDasharray="6 4" />
              <path d="M35 65C35 50 42 40 50 40C58 40 65 50 65 65" stroke="#E05638" strokeWidth="6" strokeLinecap="round" />
              <circle cx="50" cy="27" r="5" fill="#E05638" />
            </svg>
            <span className="font-bold text-white">QuantCoach AI</span>
          </div>
          <p className="text-neutral-500">
            &copy; {new Date().getFullYear()} QuantCoach AI. All rights reserved. Secure cookie-based authentication.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
