import React from "react";
import { Bot, Sparkles, BrainCircuit, Mic, ArrowRight, Clock } from "lucide-react";

const AICoachUnderDevelopment = ({ onGoToDashboard }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center light-scroll">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm text-center relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Development Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold mb-6">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Feature Under Active Development</span>
        </div>

        {/* Icon Emblem */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-6">
          <Bot className="w-10 h-10 text-white" />
        </div>

        {/* Main Title & Subtitle */}
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
          QuantCoach AI is Under Development
        </h2>
        <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-8">
          We are currently fine-tuning and calibrating our memory-aware behavioral models. This feature is in active development to bring you intelligent psychology mentoring, voice trade debriefs, and deep cognitive habit analysis.
        </p>

        {/* Preview of Upcoming Capabilities */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Mindset Diagnostics</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Identifies cognitive biases like revenge trading and FOMO from your trade journal entries.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Voice Journaling</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Speak your market reflections aloud. Auto-extracts tags, rules, and emotion triggers.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
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
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
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

