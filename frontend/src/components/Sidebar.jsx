import React from "react";
import {
  LogOut,
  User as UserIcon,
  BarChart3,
  Calendar as CalendarIcon,
  Settings,
  Zap,
  History,
} from "lucide-react";

const Logo = () => (
  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="28" stroke="#E05638" strokeWidth="5" strokeDasharray="6 4" />
    <path d="M35 65C35 50 42 40 50 40C58 40 65 50 65 65" stroke="#E05638" strokeWidth="6.5" strokeLinecap="round" />
    <path d="M42 65C42 55 46 50 50 50C54 50 58 55 58 65" stroke="#E05638" strokeWidth="5.5" strokeLinecap="round" />
    <circle cx="50" cy="27" r="5.5" fill="#E05638" />
  </svg>
);

const Sidebar = ({ activeTab, setActiveTab, getFullName, logout }) => {
  const navItems = [
    { key: "Dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4 text-violet-600" /> },
    { key: "Trades",    label: "Trades (Log)", icon: <Zap className="w-4 h-4 text-emerald-600" /> },
    { key: "Calendar",  label: "Calendar",     icon: <CalendarIcon className="w-4 h-4 text-amber-600" /> },
    { key: "History",   label: "History",      icon: <History className="w-4 h-4 text-indigo-600" /> },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between h-full flex-shrink-0">
      <div className="flex flex-col">
        {/* Logo Brand Header */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-200 select-none">
          <Logo />
          <span className="text-base font-extrabold tracking-tight text-slate-900">QuantCoach AI</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sidebar Bottom Profile Card */}
      <div className="p-4 border-t border-slate-200">
        <div
          onClick={() => setActiveTab("Profile & Settings")}
          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "Profile & Settings"
              ? "bg-slate-100 border border-slate-200"
              : "bg-slate-50/50 border border-transparent hover:bg-slate-100/50"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 flex-shrink-0">
              <UserIcon className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate">{getFullName()}</span>
            </div>
          </div>
          <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </div>

        <button
          onClick={logout}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg transition-all text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
