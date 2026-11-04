import React from "react";
import {
  LogOut,
  User as UserIcon,
  BarChart3,
  Calendar as CalendarIcon,
  Settings,
  Zap,
  History,
  Bot,
  StickyNote,
  X,
} from "lucide-react";

const Logo = () => (
  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="28" stroke="#E05638" strokeWidth="5" strokeDasharray="6 4" />
    <path d="M35 65C35 50 42 40 50 40C58 40 65 50 65 65" stroke="#E05638" strokeWidth="6.5" strokeLinecap="round" />
    <path d="M42 65C42 55 46 50 50 50C54 50 58 55 58 65" stroke="#E05638" strokeWidth="5.5" strokeLinecap="round" />
    <circle cx="50" cy="27" r="5.5" fill="#E05638" />
  </svg>
);

const Sidebar = ({ activeTab, setActiveTab, getFullName, logout, isOpen = false, onClose }) => {
  const navItems = [
    { key: "Dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4 text-violet-600" /> },
    { key: "Trades", label: "Trades (Log)", icon: <Zap className="w-4 h-4 text-emerald-600" /> },
    { key: "AICoach", label: "AI Coach", icon: <Bot className="w-4 h-4 text-violet-650" />, badge: "In Dev" },
    { key: "Calendar", label: "Calendar", icon: <CalendarIcon className="w-4 h-4 text-amber-600" /> },
    { key: "DailyNotes", label: "Daily Notes", icon: <StickyNote className="w-4 h-4 text-amber-500" /> },
    { key: "History", label: "History", icon: <History className="w-4 h-4 text-indigo-600" /> },
  ];

  const handleTabClick = (key) => {
    setActiveTab(key);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between h-full transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 md:z-auto flex-shrink-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto light-scroll">
          {/* Logo Brand Header & Mobile Close */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 select-none flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-base font-extrabold tracking-tight text-slate-900">QuantCoach AI</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1.5 -mr-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 p-4 flex-shrink-0">
            {navItems.map(({ key, label, icon, badge }) => (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === key
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  {icon}
                  <span>{label}</span>
                </div>
                {badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 tracking-wide">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0">
          <div
            onClick={() => handleTabClick("Profile & Settings")}
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
    </>
  );
};

export default Sidebar;
