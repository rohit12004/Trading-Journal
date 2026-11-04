import React from "react";
import { Bot, Sparkles, BrainCircuit, Mic, ArrowRight, Clock } from "lucide-react";

const AICoachUnderDevelopment = ({ onGoToDashboard }) => {
  return (
    <div
      className="flex-1 min-h-0 h-full overflow-y-auto overscroll-y-contain touch-pan-y p-4 sm:p-6 md:p-8 pb-28 sm:pb-16 light-scroll w-full"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="max-w-2xl mx-auto my-2 md:my-6 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-sm text-center relative">
        {/* Subtle Background Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Development Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[11px] sm:text-xs font-bold mb-4 sm:mb-6">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Feature Under Active Development</span>
        </div>

        {/* Icon Emblem */}
        <div className="mx-auto w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-4 sm:mb-6">
          <Bot className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
        </div>

        {/* Main Title & Subtitle */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-2 sm:mb-3">
          QuantCoach AI is Under Development
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-6 sm:mb-8">
          We are currently fine-tuning and calibrating our memory-aware behavioral models. This feature is in active development to bring you intelligent psychology mentoring, voice trade debriefs, and deep cognitive habit analysis.
        </p>

        {/* Preview of Upcoming Capabilities */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left mb-6 sm:mb-8">
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center mb-2.5">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Mindset Diagnostics</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Identifies cognitive biases like revenge trading and FOMO from your trade journal entries.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2.5">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Voice Journaling</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Speak your market reflections aloud. Auto-extracts tags, rules, and emotion triggers.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">AI Mentor Chat</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Continuous dialogue grounded in your personal trading rules and psychological patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {onGoToDashboard && (
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AICoachUnderDevelopment;
