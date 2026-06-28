import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.52-.64.74-1.2 1.88-1.05 3 .1.01.21.02.31.02.94 0 2.08-.63 2.69-1.48"/>
  </svg>
);

const Register = () => {
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!formData.firstName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(
        formData.firstName,
        formData.middleName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.confirmPassword
      );
      toast.success("Account created! Verification code sent to " + formData.email);
      // Redirect to OTP page, pass email in state
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      if (detail && detail.includes("already exists")) {
        toast.error("This email is already registered! Redirecting to login...");
        setTimeout(() => {
          navigate("/login", { state: { email: formData.email } });
        }, 1500);
      } else {
        toast.error(
          detail || "An error occurred during registration. Please try again."
        );
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
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 mb-1">Create Account</h2>
          <p className="text-neutral-500 text-xs mb-6 text-center">Start tracking your trading edge today.</p>
          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            {/* Names row: compact grid layout */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-2 py-1.5 text-xs outline-none transition-all placeholder-slate-400 text-slate-800"
                  required
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Middle</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="R."
                  className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-2 py-1.5 text-xs outline-none transition-all placeholder-slate-400 text-slate-800"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-2 py-1.5 text-xs outline-none transition-all placeholder-slate-400 text-slate-800"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Email address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Example@gmail.com"
                className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-1.5 text-xs outline-none transition-all placeholder-slate-400 text-slate-800"
                required
              />
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg pl-3 pr-8 py-1.5 text-xs outline-none transition-all placeholder-slate-400 text-slate-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Confirm Password *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-1.5 text-xs outline-none transition-all placeholder-slate-400 text-slate-800"
                  required
                />
              </div>
            </div>
            
            <p className="text-[9px] text-neutral-400 mt-1 leading-normal">
              Password must be 8+ characters and contain 1 uppercase, 1 lowercase, and 1 digit.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-850 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="text-center mt-4 text-xs text-neutral-500">
            Already have an account?{" "}
            <Link to="/login" className="text-neutral-950 font-bold hover:underline">
              Log in
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-neutral-400 mt-5 leading-relaxed max-w-[280px]">
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
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-neutral-900/10 flex flex-col justify-end p-8 lg:p-12 text-white">
            {/* Slider Indicator Mock */}
            <div className="flex gap-1.5 mb-4">
              <span className="h-1 w-8 bg-white/30 rounded-full"></span>
              <span className="h-1 w-8 bg-white rounded-full"></span>
              <span className="h-1 w-8 bg-white/30 rounded-full"></span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">Elevate your trading edge</h3>
            <p className="text-neutral-300 text-xs lg:text-sm leading-relaxed max-w-md">
              Log trades, discover performance parameters, and let AI analyze your execution patterns to build consistency and protect your capital.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Register;
