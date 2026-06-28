import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import coverImage from "../assets/login_cover.png";

const Logo = () => (
  <svg className="w-10 h-10 mb-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="28" stroke="#E05638" strokeWidth="3.5" strokeDasharray="6 4" />
    <path d="M35 65C35 50 42 40 50 40C58 40 65 50 65 65" stroke="#E05638" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M42 65C42 55 46 50 50 50C54 50 58 55 58 65" stroke="#E05638" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="50" cy="27" r="4.5" fill="#E05638" />
  </svg>
);

const VerifyOTP = () => {
  const { verifyOtp, resendOtp } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Get email from router navigation state (e.g. from Register page redirect)
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // Focus helper
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Only accept numbers

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace focus transfer
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) {
      toast.error("Please paste exactly a 6-digit code.");
      return;
    }

    const digits = pasteData.split("");
    setOtp(digits);

    // Focus last input
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter all 6 digits.");
      return;
    }

    if (timer <= 0) {
      toast.error("Verification code has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      toast.success("Verification successful! Auto-logging you in...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Invalid or incorrect code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email address. Please register again.");
      return;
    }

    setResending(true);
    try {
      await resendOtp(email);
      setOtp(["", "", "", "", "", ""]);
      setTimer(300); // Reset timer to 5 minutes
      toast.success("A new verification code has been sent!");
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-neutral-900 grid grid-cols-1 md:grid-cols-2">
      
      {/* Left Column: Form Area */}
      <div className="flex flex-col justify-between items-center py-6 px-6 sm:px-12 md:px-16 lg:px-24 h-full bg-white overflow-y-auto">
        <div /> {/* Spacer */}
        
        {/* Main Content Area (Increased width to match login/register) */}
        <div className="w-full max-w-md flex flex-col items-center">
          <Logo />
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 mb-1">Verify Email</h2>
          <p className="text-neutral-500 text-xs mb-6 text-center">
            We sent a verification code to <br />
            <span className="text-neutral-950 font-bold">{email || "your registered email"}</span>
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            
            {/* OTP Digit Inputs */}
            <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={timer <= 0 || loading}
                  className="w-12 h-14 text-center text-xl font-bold border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg text-neutral-950 transition-all outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                />
              ))}
            </div>

            {/* Countdown timer */}
            <div className="text-center text-xs">
              {timer > 0 ? (
                <p className="text-neutral-500">
                  Code expires in: <span className="text-neutral-950 font-bold font-mono">{formatTime(timer)}</span>
                </p>
              ) : (
                <p className="text-red-500 font-bold">Code has expired</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || timer <= 0}
              className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-850 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              ) : (
                "Verify & Log in"
              )}
            </button>
          </form>

          {/* Resend button */}
          <div className="text-center mt-5 text-xs text-neutral-500">
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-neutral-950 font-bold hover:underline inline-flex items-center gap-1.5"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend Code"
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
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
              <span className="h-1 w-8 bg-white/30 rounded-full"></span>
              <span className="h-1 w-8 bg-white rounded-full"></span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">Verify your account</h3>
            <p className="text-neutral-300 text-xs lg:text-sm leading-relaxed max-w-md">
              Confirm your email address coordinates to unlock secure, automated trade logging and AI-driven behavioral feedback.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default VerifyOTP;
