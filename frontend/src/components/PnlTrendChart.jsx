import React, { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Layers, BarChart2 } from "lucide-react";

const PnlTrendChart = ({ trades = [], pnlMode = "NET", period = "30" }) => {
  const [chartView, setChartView] = useState("CUMULATIVE"); // "CUMULATIVE" or "DAILY"
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 1. Process trades into daily aggregated data points
  const chartData = useMemo(() => {
    // Filter closed trades with exit prices
    const closed = trades.filter((t) => t.exit_price !== null && t.exit_price !== undefined);

    // Group trades by date (YYYY-MM-DD)
    const dateMap = {};
    closed.forEach((t) => {
      const dateStr = t.timestamp
        ? t.timestamp.split("T")[0]
        : t.created_at
          ? t.created_at.split("T")[0]
          : null;

      if (!dateStr) return;

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { netPnl: 0, grossPnl: 0, count: 0 };
      }
      dateMap[dateStr].netPnl += t.pnl || 0;
      dateMap[dateStr].grossPnl += (t.pnl || 0) + (t.brokerage || 0);
      dateMap[dateStr].count += 1;
    });

    // Sort dates chronologically
    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));

    if (sortedDates.length === 0) return [];

    let runningCumulative = 0;
    return sortedDates.map((dateStr) => {
      const dayData = dateMap[dateStr];
      const dailyVal = pnlMode === "NET" ? dayData.netPnl : dayData.grossPnl;
      runningCumulative += dailyVal;

      return {
        date: dateStr,
        formattedDate: new Date(dateStr).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        fullDate: new Date(dateStr).toLocaleDateString(undefined, {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        dailyPnl: dailyVal,
        cumulativePnl: runningCumulative,
        tradesCount: dayData.count,
      };
    });
  }, [trades, pnlMode]);

  // Dimensions & Padding
  const width = 800;
  const height = 280;
  const paddingTop = 30;
  const paddingBottom = 40;
  const paddingLeft = 65;
  const paddingRight = 30;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Compute Min/Max for Y-Axis (Ensure 0 baseline is included)
  const { minVal, maxVal, points } = useMemo(() => {
    if (chartData.length === 0) {
      return { minVal: -1000, maxVal: 1000, points: [] };
    }

    const values = chartData.map((d) => (chartView === "CUMULATIVE" ? d.cumulativePnl : d.dailyPnl));

    let min = Math.min(...values, 0);
    let max = Math.max(...values, 0);

    // Add padding to Y range so line doesn't hit edge
    const rangeMargin = (max - min) * 0.15 || 500;
    min = min - rangeMargin;
    max = max + rangeMargin;

    const valRange = max - min || 1;

    // Calculate (x, y) coordinates for each data point
    const computedPoints = chartData.map((d, index) => {
      const value = chartView === "CUMULATIVE" ? d.cumulativePnl : d.dailyPnl;
      const x = paddingLeft + (index / (chartData.length - 1 || 1)) * innerWidth;
      const y = paddingTop + innerHeight - ((value - min) / valRange) * innerHeight;
      return { ...d, x, y, value };
    });

    return { minVal: min, maxVal: max, points: computedPoints };
  }, [chartData, chartView, innerWidth, innerHeight, paddingLeft, paddingTop]);

  // Calculate Zero Line Y position
  const yZero = useMemo(() => {
    const valRange = maxVal - minVal || 1;
    return paddingTop + innerHeight - ((0 - minVal) / valRange) * innerHeight;
  }, [minVal, maxVal, paddingTop, innerHeight]);

  // Build SVG Path string
  const linePathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), "");
  }, [points]);

  // Build Area Path string down to Zero Line
  const areaPathD = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePathD} L ${lastX} ${yZero} L ${firstX} ${yZero} Z`;
  }, [linePathD, points, yZero]);

  // Generate 5 dynamic Y-Axis Ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const val = maxVal - (i / (count - 1)) * (maxVal - minVal);
      const y = paddingTop + (i / (count - 1)) * innerHeight;
      ticks.push({ val, y });
    }
    return ticks;
  }, [minVal, maxVal, paddingTop, innerHeight]);

  // Formatting Y-axis amounts
  const formatYVal = (val) => {
    if (Math.abs(val) < 0.01) return "₹0";
    const sign = val > 0 ? "+" : "";
    if (Math.abs(val) >= 1000) {
      return `${sign}₹${(val / 1000).toFixed(1)}k`;
    }
    return `${sign}₹${val.toFixed(0)}`;
  };

  // Overall Peak P&L & Drawdown for summary metrics
  const summaryStats = useMemo(() => {
    if (chartData.length === 0) return { peak: 0, current: 0 };
    const latest = chartData[chartData.length - 1].cumulativePnl;
    const peak = Math.max(...chartData.map((d) => d.cumulativePnl));
    return { peak, current: latest };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm text-left">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">P&amp;L Performance Curve</h3>
            <p className="text-slate-400 text-xs">Visualizing profit/loss trajectory over time.</p>
          </div>
        </div>
        <div className="py-12 text-slate-400 text-xs font-bold">
          No closed trade records available for the selected filter period to render line chart.
        </div>
      </div>
    );
  }

  const isOverallProfit = summaryStats.current >= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow text-left">

      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {chartView === "CUMULATIVE" ? "Cumulative Equity Curve" : "Daily P&L Performance"}
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {pnlMode === "NET" ? "Net P&L" : "Gross P&L"}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Dynamic chart showing profit/loss above or below the ₹0 horizontal baseline.
          </p>
        </div>

        {/* View Switcher: Cumulative vs Daily */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 shadow-inner w-full sm:w-auto">
          <button
            onClick={() => setChartView("CUMULATIVE")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${chartView === "CUMULATIVE"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
            Cumulative
          </button>
          <button
            onClick={() => setChartView("DAILY")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${chartView === "DAILY"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            Daily Sessions
          </button>
        </div>
      </div>

      {/* Interactive SVG Canvas Container */}
      <div className="relative mt-4 w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Gradient for Positive Area (Above Zero Line) */}
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>

            {/* Gradient for Negative Area (Below Zero Line) */}
            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Ticks */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] font-mono font-semibold fill-slate-400"
              >
                {formatYVal(tick.val)}
              </text>
            </g>
          ))}

          {/* ZERO BASELINE HORIZONTAL LINE (y = yZero) */}
          <line
            x1={paddingLeft}
            y1={yZero}
            x2={width - paddingRight}
            y2={yZero}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={paddingLeft - 8}
            y={yZero + 4}
            textAnchor="end"
            className="text-[10px] font-mono font-bold fill-slate-700"
          >
            ₹0.00
          </text>

          {/* Area Fill under/above curve */}
          <path
            d={areaPathD}
            fill={isOverallProfit ? "url(#profitGradient)" : "url(#lossGradient)"}
          />

          {/* Dynamic P&L Curve Line */}
          <path
            d={linePathD}
            fill="none"
            stroke={isOverallProfit ? "#10b981" : "#f43f5e"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points (Dots on curve) */}
          {points.map((pt, idx) => {
            const isPtProfit = pt.value >= 0;
            return (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.date === pt.date ? "6" : "4"}
                fill={isPtProfit ? "#10b981" : "#f43f5e"}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer transition-all hover:scale-125"
                onMouseEnter={() => setHoveredPoint(pt)}
              />
            );
          })}

          {/* Interactive Hover Vertical Crosshair */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={height - paddingBottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="7"
                fill={hoveredPoint.value >= 0 ? "#10b981" : "#f43f5e"}
                stroke="#ffffff"
                strokeWidth="2.5"
                className="animate-ping"
              />
            </g>
          )}

          {/* X-Axis Date Labels */}
          {points.map((pt, idx) => {
            // Show dates evenly depending on data length
            const step = Math.max(1, Math.floor(points.length / 6));
            if (idx % step !== 0 && idx !== points.length - 1) return null;

            return (
              <text
                key={idx}
                x={pt.x}
                y={height - 12}
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-slate-400"
              >
                {pt.formattedDate}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip Box on Hover */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white text-[11px] p-3 rounded-2xl shadow-2xl border border-slate-800 whitespace-nowrap animate-fade-in"
            style={{
              left: `${Math.min(Math.max(hoveredPoint.x, 120), width - 140)}px`,
              top: `${Math.max(hoveredPoint.y - 75, 10)}px`,
            }}
          >
            <div className="font-bold text-[10px] text-slate-400 border-b border-slate-800 pb-1 mb-1.5 uppercase tracking-wider">
              {hoveredPoint.fullDate}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between gap-6">
                <span className="text-slate-400">Daily P&amp;L:</span>
                <span className={`font-mono font-bold ${hoveredPoint.dailyPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {hoveredPoint.dailyPnl >= 0 ? "+" : ""}₹{hoveredPoint.dailyPnl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-slate-400">Cumulative P&amp;L:</span>
                <span className={`font-mono font-black ${hoveredPoint.cumulativePnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {hoveredPoint.cumulativePnl >= 0 ? "+" : ""}₹{hoveredPoint.cumulativePnl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-6 text-[10px] text-slate-400 pt-0.5 border-t border-slate-800">
                <span>Logged Trades:</span>
                <span className="font-bold text-slate-300">{hoveredPoint.tradesCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend & Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-xs pt-4 mt-2 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-500 rounded"></span>
            <span>Above ₹0 Baseline (Profit Zone)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 rounded"></span>
            <span>Below ₹0 Baseline (Loss Zone)</span>
          </div>
        </div>

        <div className="text-[10px] font-bold text-slate-400">
          {chartData.length} active trading day{chartData.length !== 1 ? "s" : ""} plotted
        </div>
      </div>
    </div>
  );
};

export default PnlTrendChart;
