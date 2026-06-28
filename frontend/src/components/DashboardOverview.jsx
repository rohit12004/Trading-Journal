import React, { useState } from "react";
import { TrendingUp, Percent, Wallet, ArrowUpRight } from "lucide-react";
import { useMetricsQuery } from "../hooks/useTradingQuery";

const DashboardOverview = ({ trades = [] }) => {
  const { data: metrics = { total_capital: 0, current_balance: 0, net_pnl: 0 } } = useMetricsQuery();
  // State for period filtering
  const [period, setPeriod] = useState("30");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Filter trades based on selected period
  const getFilteredTrades = () => {
    const now = new Date();
    return trades.filter((t) => {
      const dateToUse = t.timestamp || t.created_at;
      if (!dateToUse) return false;
      const tradeDate = new Date(dateToUse);

      if (period === "30") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return tradeDate >= thirtyDaysAgo;
      }
      if (period === "60") {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(now.getDate() - 60);
        return tradeDate >= sixtyDaysAgo;
      }
      if (period === "90") {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return tradeDate >= ninetyDaysAgo;
      }
      if (period === "CUSTOM") {
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return tradeDate >= start && tradeDate <= end;
      }
      return true;
    });
  };

  const filteredTrades = getFilteredTrades();

  // Calculate metrics dynamically based on filtered trades
  const closedTrades = filteredTrades.filter((t) => t.exit_price !== null);
  
  const netPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalTrades = closedTrades.length;
  
  const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter((t) => (t.pnl || 0) < 0);
  
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0.0;
  const lossRate = 100 - winRate;

  // Group metrics by asset class
  const getAssetClassMetrics = () => {
    const breakdown = {
      STOCKS: { netPnl: 0, total: 0, wins: 0 },
      OPTIONS: { netPnl: 0, total: 0, wins: 0 },
      FUTURES: { netPnl: 0, total: 0, wins: 0 }
    };

    closedTrades.forEach((t) => {
      const asset = (t.asset_class || "STOCKS").toUpperCase();
      if (breakdown[asset]) {
        breakdown[asset].netPnl += t.pnl || 0;
        breakdown[asset].total += 1;
        if ((t.pnl || 0) > 0) {
          breakdown[asset].wins += 1;
        }
      }
    });

    return breakdown;
  };

  const assetMetrics = getAssetClassMetrics();

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 light-scroll">

      {/* Header & Date Range Filter controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 text-xs">Aggregated analytics across your closed trade sessions.</p>
        </div>
        
        {/* Period Selector Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 max-w-full">
          {period === "CUSTOM" && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm mr-1 animate-fade-in">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-800 outline-none text-xs px-2 py-1 font-semibold"
              />
              <span className="text-slate-400 text-xs">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-800 outline-none text-xs px-2 py-1 font-semibold"
              />
            </div>
          )}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 shadow-inner self-start sm:self-center">
            {[
              { key: "30", label: "30 Days" },
              { key: "60", label: "60 Days" },
              { key: "90", label: "90 Days" },
              { key: "CUSTOM", label: "Custom" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Cards Row (4 columns for Net P&L, Win Rate, Starting Capital, and Account Balance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net P&L Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-left shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Net P&amp;L (Period)</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className={`text-2xl font-black font-mono tracking-tight ${netPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {netPnl >= 0 ? "+" : ""}₹{netPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">P&amp;L for selected filter period</p>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-left shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Win Rate (Period)</span>
            <Percent className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-violet-600 tracking-tight">
              {winRate.toFixed(1)}%
            </p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">{winningTrades.length} W / {losingTrades.length} L</p>
          </div>
        </div>

        {/* Starting Capital Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-left shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Starting Capital</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-slate-800 tracking-tight">
              ₹{(metrics.total_capital || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Total net funding added</p>
          </div>
        </div>

        {/* Account Balance Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-left shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Balance</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                ₹{(metrics.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Current net worth (Capital + Lifetime P&amp;L)</p>
          </div>
        </div>
      </div>

      {/* Visuals Block: Donut + Asset Class Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
        {/* Wins vs Losses Donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Wins VS Losses</h3>
          <div className="flex justify-center items-center py-4 relative">
            <svg className="w-32 h-32" viewBox="0 0 36 36">
              {/* Red circle represents losses */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3" />
              {/* Green circle represents wins */}
              {winRate > 0 && (
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2"
                        strokeDasharray={`${winRate} ${lossRate}`} strokeDashoffset="25" />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-black font-mono text-slate-800">{winRate.toFixed(1)}%</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">WIN RATE</span>
            </div>
          </div>
          
          {/* Detailed legend */}
          <div className="flex justify-center gap-6 text-xs font-semibold pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600">Wins: {winningTrades.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <span className="text-slate-600">Losses: {losingTrades.length}</span>
            </div>
          </div>
        </div>

        {/* Asset Class P&L Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Asset Class Performance</h3>
            <div className="space-y-4">
              {Object.entries(assetMetrics).map(([asset, data]) => {
                const winRateVal = data.total > 0 ? (data.wins / data.total) * 100 : 0;
                const isProfit = data.netPnl >= 0;
                const pnlFormatted = `${isProfit ? "+" : ""}₹${data.netPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                // Color mapping for asset classes
                const colors = {
                  STOCKS: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Stocks" },
                  OPTIONS: { bg: "bg-violet-50 text-violet-700 border-violet-100", label: "Options" },
                  FUTURES: { bg: "bg-amber-50 text-amber-700 border-amber-100", label: "Futures" }
                }[asset] || { bg: "bg-slate-50 text-slate-700 border-slate-100", label: asset };

                return (
                  <div key={asset} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${colors.bg}`}>
                        {colors.label}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {data.total > 0 ? `${winRateVal.toFixed(1)}% WR (${data.wins}W / ${data.total - data.wins}L)` : "No trades logged"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-xs font-black ${data.netPnl === 0 ? "text-slate-400" : isProfit ? "text-emerald-600" : "text-red-500"}`}>
                        {data.netPnl === 0 ? "₹0.00" : pnlFormatted}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold">{data.total} trade{data.total !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-semibold border-t border-slate-100 pt-3 mt-4 text-center">
            P&amp;L calculated from all closed positions in selected period.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
