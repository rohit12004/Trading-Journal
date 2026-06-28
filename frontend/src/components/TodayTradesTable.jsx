import React from "react";
import { Trash2 } from "lucide-react";

const TodayTradesTable = ({ todayTrades, todayPnl, handleDeleteTrade }) => {
  return (
    <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-sm">

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 flex-shrink-0">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Today's Logged Trades ({todayTrades.length})
        </h3>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-y-auto max-h-[360px] light-scroll">
        {todayTrades.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            No trades logged today yet. Use the logger on the left to start!
          </div>
        ) : (
          <table className="w-full text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs">
                <th className="py-2 text-left uppercase">Asset Class</th>
                <th className="py-2 text-left uppercase">Symbol</th>
                <th className="py-2 text-left uppercase">Dir</th>
                <th className="py-2 text-right uppercase">Qty</th>
                <th className="py-2 text-right uppercase">Net P&L</th>
                <th className="py-2 text-right uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
              {todayTrades.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-sans font-bold text-slate-500 text-xs">
                    {t.asset_class || "STOCKS"}
                  </td>
                  <td className="py-2.5 font-bold text-slate-800">
                    <div>{t.symbol}</div>
                    {t.entry_time && (
                      <div className="text-[10px] text-slate-400 font-normal font-sans">
                        {t.entry_time}{t.exit_time ? ` - ${t.exit_time}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[14px] font-bold ${
                      ["BUY", "CALL"].includes(t.direction)
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                    }`}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {t.quantity} {t.asset_class === "STOCKS" ? "sh" : "lots"}
                  </td>
                  <td className={`py-2.5 text-right font-bold ${t.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {t.pnl >= 0 ? "+" : ""}₹{t.pnl?.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleDeleteTrade(t.id)}
                      className="text-black hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Today's Net P&L Footer */}
      <div className="border-t border-slate-100 pt-3 mt-2 flex justify-between items-center flex-shrink-0">
        <span className="text-xs font-bold text-slate-700">Today's Total Net P&L:</span>
        <span className={`text-sm font-black font-mono px-3 py-1 rounded-lg ${
          todayPnl >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        }`}>
          {todayPnl >= 0 ? "+" : ""}₹{todayPnl.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default TodayTradesTable;
