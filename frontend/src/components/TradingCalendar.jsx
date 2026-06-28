import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText } from "lucide-react";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const weekdayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TradingCalendar = ({ trades = [], onDayClick }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar days (starting on Monday)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Number of padding days for Monday start:
  // If first day is Sun (0), we need 6 padding days.
  // If first day is Mon (1), we need 0 padding days.
  // If first day is Tue (2), we need 1 padding day.
  const paddingDaysCount = (firstDayIndex + 6) % 7;
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  
  const paddingDays = [];
  for (let i = paddingDaysCount - 1; i >= 0; i--) {
    paddingDays.push({
      dayNum: prevMonthDays - i,
      isCurrentMonth: false,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
    });
  }

  const currentDays = [];
  for (let i = 1; i <= totalDays; i++) {
    currentDays.push({
      dayNum: i,
      isCurrentMonth: true,
      month: currentMonth,
      year: currentYear,
    });
  }

  // Next month padding days to complete rows (7-column grid)
  const totalGridCells = paddingDays.length + currentDays.length;
  const remainingCells = totalGridCells % 7 === 0 ? 0 : 7 - (totalGridCells % 7);
  const nextPaddingDays = [];
  for (let i = 1; i <= remainingCells; i++) {
    nextPaddingDays.push({
      dayNum: i,
      isCurrentMonth: false,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
    });
  }

  const allCells = [...paddingDays, ...currentDays, ...nextPaddingDays];

  // Chunk all cells into weeks (7 days each)
  const weeks = [];
  for (let i = 0; i < allCells.length; i += 7) {
    weeks.push(allCells.slice(i, i + 7));
  }

  // Format date string to YYYY-MM-DD in local time
  const getCellDateStr = (cell) => {
    const y = cell.year;
    const m = String(cell.month + 1).padStart(2, "0");
    const d = String(cell.dayNum).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = new Date().toISOString().split("T")[0];

  // Formatter for short P&L display (e.g. +₹1.5k, -₹12.1k, ₹0)
  const formatLargePnl = (val) => {
    if (!val || Math.abs(val) < 0.01) return "₹0";
    const sign = val > 0 ? "+" : "-";
    const absVal = Math.abs(val);
    if (absVal >= 1000) {
      return `${sign}₹${(absVal / 1000).toFixed(1)}k`;
    }
    return `${sign}₹${absVal.toFixed(0)}`;
  };

  // Calculate monthly stats
  const getMonthlyStats = () => {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthlyTrades = trades.filter((t) => {
      const tradeDate = t.timestamp ? t.timestamp.split("T")[0] : t.created_at ? t.created_at.split("T")[0] : null;
      return tradeDate && tradeDate.startsWith(monthStr);
    });
    const monthlyPnl = monthlyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    return { monthlyPnl, tradesCount: monthlyTrades.length };
  };

  const { monthlyPnl } = getMonthlyStats();

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 light-scroll animate-fade-in">
      
      {/* Top Header & Year Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-slate-700" />
            Trading Calendar
          </h1>
          <p className="text-slate-500 text-xs">View your trading activity daily. Hover for exact P/L and click to view trades.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner gap-0.5 max-w-full overflow-x-auto self-start sm:self-center">
          {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 2 + i).map((yr) => (
            <button
              key={yr}
              onClick={() => setCurrentYear(yr)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentYear === yr
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Card Panel (Scrollable on small viewports) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-5xl mx-auto overflow-x-auto">
        <div className="min-w-[800px] md:min-w-[900px]">
          
          {/* Month Selector & Monthly P&L Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly P&L:</span>
              <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl shadow-sm ${
                monthlyPnl >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {monthlyPnl >= 0 ? "+" : ""}₹{monthlyPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 8-Column Calendar Grid */}
          <div className="grid grid-cols-8 gap-2">
            
            {/* Weekday Column Headers */}
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="text-center font-bold text-[11px] text-slate-400 uppercase tracking-widest py-2"
              >
                {label}
              </div>
            ))}
            {/* Total Column Header */}
            <div className="text-center font-bold text-[11px] text-slate-500 uppercase tracking-widest py-2 border-l border-slate-100">
              Total
            </div>

            {/* Week Rows */}
            {weeks.map((week, weekIdx) => {
              // Calculate weekly totals
              const weeklyTrades = week.flatMap((cell) => {
                const dateStr = getCellDateStr(cell);
                return trades.filter((t) => {
                  const tradeDate = t.timestamp ? t.timestamp.split("T")[0] : t.created_at ? t.created_at.split("T")[0] : null;
                  return tradeDate === dateStr;
                });
              });

              const weeklyPnl = weeklyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
              const weeklyTradesCount = weeklyTrades.length;

              return (
                <React.Fragment key={`week-${weekIdx}`}>
                  
                  {/* 7 Days of the week */}
                  {week.map((cell, idx) => {
                    const dateStr = getCellDateStr(cell);
                    const isToday = dateStr === todayStr;

                    const dayTrades = trades.filter((t) => {
                      const tradeDate = t.timestamp ? t.timestamp.split("T")[0] : t.created_at ? t.created_at.split("T")[0] : null;
                      return tradeDate === dateStr;
                    });

                    const hasTrades = dayTrades.length > 0;
                    const netPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                    const isProfit = netPnl > 0;
                    const isLoss = netPnl < 0;

                    let cellCls = "";
                    if (hasTrades) {
                      if (isProfit) {
                        cellCls = "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white shadow-sm";
                      } else if (isLoss) {
                        cellCls = "bg-rose-500 hover:bg-rose-600 border-rose-600 text-white shadow-sm";
                      } else {
                        cellCls = "bg-slate-500 hover:bg-slate-600 border-slate-500 text-white shadow-sm";
                      }
                    } else {
                      cellCls = cell.isCurrentMonth
                        ? isToday
                          ? "border-violet-400 bg-violet-50/20 shadow-sm"
                          : "border-slate-100 bg-white hover:bg-slate-50/80 hover:shadow-sm"
                        : "border-slate-100/50 bg-slate-50/20 text-slate-300 opacity-40 hover:bg-slate-50/40";
                    }

                    const formattedDateLabel = new Date(dateStr).toLocaleDateString(undefined, {
                      weekday: "short", year: "numeric", month: "short", day: "numeric"
                    });

                    return (
                      <div
                        key={`${dateStr}-${idx}`}
                        onClick={() => onDayClick(dateStr)}
                        className={`relative group flex flex-col justify-between h-20 md:h-24 p-2 md:p-2.5 border rounded-2xl cursor-pointer transition-all ${cellCls}`}
                      >
                        {/* Top row: day number and document icon */}
                        <div className="flex justify-between items-center w-full">
                          <span className={`text-[10px] font-bold ${
                            hasTrades
                              ? "text-white/80"
                              : cell.isCurrentMonth
                                ? isToday
                                  ? "text-violet-600 font-extrabold"
                                  : "text-slate-500"
                                : "text-slate-300"
                          }`}>
                            {String(cell.dayNum).padStart(2, "0")}
                          </span>
                          {hasTrades && (
                            <FileText className="w-3.5 h-3.5 text-white/95" />
                          )}
                        </div>

                        {/* Center row: short P&L value */}
                        <div className="text-center">
                          <span className={`text-xs md:text-sm font-black tracking-tight font-sans ${
                            hasTrades ? "text-white" : "text-slate-350"
                          }`}>
                            {formatLargePnl(netPnl)}
                          </span>
                        </div>

                        {/* Bottom row: trades count */}
                        <div className={`text-[9px] font-sans truncate ${
                          hasTrades ? "text-white/85" : "text-slate-400"
                        }`}>
                          {dayTrades.length} trade{dayTrades.length !== 1 ? "s" : ""}
                        </div>

                        {/* Glassmorphic Tooltip on Hover */}
                        {hasTrades && (
                          <div className="absolute z-35 bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block bg-slate-900/95 backdrop-blur-md text-white text-[11px] p-3 rounded-2xl shadow-xl border border-slate-800 pointer-events-none whitespace-nowrap">
                            <div className="font-bold text-[10px] text-slate-400 border-b border-slate-800 pb-1 mb-1.5 uppercase tracking-wider text-center">
                              {formattedDateLabel}
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Logged Trades:</span>
                                <span className="font-bold text-slate-200">{dayTrades.length}</span>
                              </div>
                              <div className="flex justify-between gap-6">
                                <span className="text-slate-400">Net P&L:</span>
                                <span className={`font-black font-mono ${netPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {netPnl >= 0 ? "+" : ""}₹{netPnl.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            {/* Tooltip Arrow */}
                            <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-800 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-0.5"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 8th Column: Weekly Total Summary */}
                  <div
                    className="flex flex-col justify-between h-20 md:h-24 p-2 md:p-2.5 border border-slate-100 bg-slate-50/50 rounded-2xl select-none border-l-2"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Wk {weekIdx + 1}
                    </div>
                    <div className="text-center">
                      <span className={`text-xs md:text-sm font-black tracking-tight font-sans ${
                        weeklyPnl > 0 ? "text-emerald-600" : weeklyPnl < 0 ? "text-rose-500" : "text-slate-350"
                      }`}>
                        {formatLargePnl(weeklyPnl)}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans truncate">
                      {weeklyTradesCount} trade{weeklyTradesCount !== 1 ? "s" : ""}
                    </div>
                  </div>

                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingCalendar;
