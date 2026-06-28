import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import coverImage from "../assets/login_cover.png";

const Logo = () => (
  <svg className="w-10 h-10 mb-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="28" stroke="#E05638" strokeWidth="3.5" strokeDasharray="6 4" />
    <path d="M35 65C35 50 42 40 50 40C58 40 65 50 65 65" stroke="#E05638" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M42 65C42 55 46 50 50 50C54 50 58 55 58 65" stroke="#E05638" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="50" cy="27" r="4.5" fill="#E05638" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.52-.64.74-1.2 1.88-1.05 3 .1.01.21.02.31.02.94 0 2.08-.63 2.69-1.48"/>
  </svg>
);

const Login = () => {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Successfully logged in!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      
      if (detail && detail.includes("verify your email first")) {
        toast.error(detail + " Redirecting to verification...");
        setTimeout(() => {
          navigate("/verify-otp", { state: { email } });
        }, 1500);
      } else {
        toast.error(detail || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-neutral-900 grid grid-cols-1 md:grid-cols-2">
      
      {/* Left Column: Form Area */}
      <div className="flex flex-col justify-between items-center py-6 px-6 sm:px-12 md:px-16 lg:px-24 h-full bg-white overflow-y-auto">
        <div /> {/* Spacer */}
        
        {/* Main Content Area (Increased from max-w-sm to max-w-md) */}
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Logo & Headings */}
          <Logo />
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 mb-1">Welcome Back!</h2>
          <p className="text-neutral-500 text-xs mb-6 text-center">Sign in to continue where you left off.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Example@gmail.com"
                className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs outline-none transition-all placeholder-slate-400"
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-violet-600 hover:text-violet-500 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg pl-3 pr-9 py-2 text-xs outline-none transition-all placeholder-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-850 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="text-center mt-5 text-xs text-neutral-500">
            Don't have account yet?{" "}
            <Link to="/register" className="text-neutral-950 font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-neutral-400 mt-6 leading-relaxed max-w-[280px]">
          By continuing you agree to our{" "}
          <a href="#" className="underline hover:text-neutral-600">Terms & Conditions</a>{" "}
          and acknowledge our{" "}
          <a href="#" className="underline hover:text-neutral-600">Privacy Policy</a>.
        </div>
      </div>

      {/* Right Column: Hero Cover */}
      <div className="hidden md:block relative h-full w-full select-none p-4">
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={coverImage}
            alt="QuantCoach Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle gradient overlay to match image overlay look */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-neutral-900/10 flex flex-col justify-end p-8 lg:p-12 text-white">
            {/* Slider Indicator Mock */}
            <div className="flex gap-1.5 mb-4">
              <span className="h-1 w-8 bg-white rounded-full"></span>
              <span className="h-1 w-8 bg-white/30 rounded-full"></span>
              <span className="h-1 w-8 bg-white/30 rounded-full"></span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">Discover your next journey</h3>
            <p className="text-neutral-300 text-xs lg:text-sm leading-relaxed max-w-md">
              Explore ideas, stories, and experiences designed to inspire your everyday life, guiding you through meaningful moments and fresh insights every day.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
