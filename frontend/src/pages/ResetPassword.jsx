import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import client from "../api/client";
import coverImage from "../assets/login_cover.png";

const Logo = () => (
  <svg className="w-10 h-10 mb-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="28" stroke="#E05638" strokeWidth="3.5" strokeDasharray="6 4" />
    <path d="M35 65C35 50 42 40 50 40C58 40 65 50 65 65" stroke="#E05638" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M42 65C42 55 46 50 50 50C54 50 58 55 58 65" stroke="#E05638" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="50" cy="27" r="4.5" fill="#E05638" />
  </svg>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !otpCode || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (otpCode.length !== 6) {
      toast.error("Verification code must be exactly 6 digits.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await client.post("/auth/reset-password", {
        email,
        otp_code: otpCode,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      toast.success("Password reset successfully! Please log in.");
      navigate("/login", { state: { email } });
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.detail || "Failed to reset password. Please verify the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-neutral-900 grid grid-cols-1 md:grid-cols-2">
      
      {/* Left Column: Form Area */}
      <div className="flex flex-col justify-between items-center py-6 px-6 sm:px-12 md:px-16 lg:px-24 h-full bg-white overflow-y-auto">
        <div /> {/* Spacer */}

        {/* Main Content Box */}
        <div className="w-full max-w-md flex flex-col items-center">
          <Logo />
          <h2 className="text-2xl font-bold tracking-tight text-neutral-955 mb-1">Reset Password</h2>
          <p className="text-neutral-500 text-xs mb-6 text-center">
            Enter the 6-digit OTP code sent to your email and your new password.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            
            {/* Email (Readonly if prefilled, otherwise editable) */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Example@gmail.com"
                className={`w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs outline-none transition-all placeholder-slate-400 ${
                  location.state?.email ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""
                }`}
                disabled={!!location.state?.email}
                required
              />
            </div>

            {/* OTP Code */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Reset Code (6 Digits)</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs outline-none transition-all placeholder-slate-400 font-mono tracking-widest text-center"
                required
              />
            </div>

            {/* New Password */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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

            {/* Confirm Password */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs outline-none transition-all placeholder-slate-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-955 hover:bg-neutral-850 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-5 text-xs text-neutral-500">
            Remembered your password?{" "}
            <Link to="/login" className="text-violet-600 font-bold hover:underline">
              Log in
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
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-neutral-900/10 flex flex-col justify-end p-8 lg:p-12 text-white">
            <div className="flex gap-1.5 mb-4">
              <span className="h-1 w-8 bg-white/30 rounded-full"></span>
              <span className="h-1 w-8 bg-white rounded-full"></span>
              <span className="h-1 w-8 bg-white/30 rounded-full"></span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">Build a robust routine</h3>
            <p className="text-neutral-300 text-xs lg:text-sm leading-relaxed max-w-md">
              Securely verify your credentials and configure account recovery rules using automated transactional SMTP notifications.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResetPassword;
