import React, { useState } from "react";
import { Trash2, Pencil, X, Loader2, Calendar as CalendarIcon, TrendingUp, Tag, Zap } from "lucide-react";
import { toast } from "sonner";
import { useUpdateTradeMutation } from "../hooks/useTradingQuery";

// ─── Reusable trade row for Stocks ──────────────────────────────────────────
const StocksRow = ({ t, handleDeleteTrade, handleEditTrade }) => (
  <tr className="hover:bg-slate-50/50">
    {/* 1. Stock Name & Direction */}
    <td className="py-3 w-[14%] text-left whitespace-nowrap">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-800 text-sm">{t.symbol}</span>
        <span className={`inline-flex items-center justify-center w-11 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap ${t.direction === "BUY" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          }`}>
          {t.direction}
        </span>
      </div>
    </td>

    {/* 2. Entry / Exit Time */}
    <td className="py-3 w-[12%] text-left whitespace-nowrap text-xs text-slate-500 font-sans">
      {t.entry_time ? `${t.entry_time} - ${t.exit_time || "—"}` : "—"}
    </td>

    {/* 3. Entry / Exit Price */}
    <td className="py-3 w-[15%] text-left whitespace-nowrap text-xs text-slate-600">
      <div><span className="text-slate-400">In:</span> ₹{t.entry_price.toFixed(2)}</div>
      {t.exit_price ? (
        <div><span className="text-slate-400">Out:</span> ₹{t.exit_price.toFixed(2)}</div>
      ) : (
        <div className="text-emerald-600 font-semibold">OPEN</div>
      )}
    </td>

    {/* 4. Qty */}
    <td className="py-3 w-[7%] text-left whitespace-nowrap text-sm text-slate-600">
      {t.quantity} sh
    </td>

    {/* 5. P&L */}
    <td className="py-3 w-[10%] text-left whitespace-nowrap">
      <div className={`font-bold text-sm ${t.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {t.pnl >= 0 ? "+" : ""}₹{t.pnl?.toFixed(2)}
      </div>
      <div className="text-[10px] text-slate-400 font-sans">
        {t.pnl >= 0 ? "PROFIT" : "LOSS"}
      </div>
    </td>

    {/* 6. Strategy */}
    <td className="py-3 pr-4 w-[17%] text-left">
      {t.strategy ? (
        <span className="inline-block max-w-full bg-violet-100 text-violet-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-violet-200 break-words whitespace-normal" title={t.strategy}>
          {t.strategy}
        </span>
      ) : (
        <span className="text-slate-300">—</span>
      )}
    </td>

    {/* 7. Notes */}
    <td className="py-3 w-[21%] text-left">
      <span className="text-slate-700 font-medium text-sm break-words whitespace-normal block" title={t.notes}>
        {t.notes || "—"}
      </span>
    </td>

    {/* 8. Action (Edit & Delete) */}
    <td className="py-3 text-right w-[4%] whitespace-nowrap">
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={() => handleEditTrade(t)} className="text-slate-300 hover:text-violet-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleDeleteTrade(t.id)} className="text-slate-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  </tr>
);

// ─── Reusable trade row for Options ──────────────────────────────────────────
const OptionsRow = ({ t, handleDeleteTrade, handleEditTrade }) => (
  <tr className="hover:bg-slate-50/50">
    {/* 1. Option Name & Direction */}
    <td className="py-3 w-[14%] text-left whitespace-nowrap">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-800 text-sm">{t.symbol}</span>
        <span className={`inline-flex items-center justify-center w-11 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap ${t.direction === "CALL" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          }`}>
          {t.direction}
        </span>
      </div>
    </td>

    {/* 2. Entry / Exit Time */}
    <td className="py-3 w-[12%] text-left whitespace-nowrap text-xs text-slate-500 font-sans">
      {t.entry_time ? `${t.entry_time} - ${t.exit_time || "—"}` : "—"}
    </td>

    {/* 3. Price / Strike */}
    <td className="py-3 w-[15%] text-left whitespace-nowrap text-xs text-slate-600">
      <div><span className="text-slate-400">Prem:</span> ₹{t.entry_price.toFixed(2)} → {t.exit_price ? `₹${t.exit_price.toFixed(2)}` : "OPEN"}</div>
      {t.strike_price && (
        <div><span className="text-slate-400">Strike:</span> ₹{t.strike_price.toFixed(2)}</div>
      )}
    </td>

    {/* 4. Lots */}
    <td className="py-3 w-[7%] text-left whitespace-nowrap text-sm text-slate-600">
      {t.quantity} lots
    </td>

    {/* 5. P&L */}
    <td className="py-3 w-[10%] text-left whitespace-nowrap">
      <div className={`font-bold text-sm ${t.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {t.pnl >= 0 ? "+" : ""}₹{t.pnl?.toFixed(2)}
      </div>
      <div className="text-[10px] text-slate-400 font-sans">
        {t.pnl >= 0 ? "PROFIT" : "LOSS"}
      </div>
    </td>

    {/* 6. Strategy */}
    <td className="py-3 pr-4 w-[17%] text-left">
      {t.strategy ? (
        <span className="inline-block max-w-full bg-violet-100 text-violet-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-violet-200 break-words whitespace-normal" title={t.strategy}>
          {t.strategy}
        </span>
      ) : (
        <span className="text-slate-300">—</span>
      )}
    </td>

    {/* 7. Notes */}
    <td className="py-3 w-[21%] text-left">
      <span className="text-slate-700 font-medium text-sm break-words whitespace-normal block" title={t.notes}>
        {t.notes || "—"}
      </span>
    </td>

    {/* 8. Action (Edit & Delete) */}
    <td className="py-3 text-right w-[4%] whitespace-nowrap">
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={() => handleEditTrade(t)} className="text-slate-300 hover:text-violet-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleDeleteTrade(t.id)} className="text-slate-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  </tr>
);

// ─── Reusable trade row for Futures ──────────────────────────────────────────
const FuturesRow = ({ t, handleDeleteTrade, handleEditTrade }) => (
  <tr className="hover:bg-slate-50/50">
    {/* 1. Future Name & Direction */}
    <td className="py-3 w-[14%] text-left whitespace-nowrap">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-800 text-sm">{t.symbol}</span>
        <span className={`inline-flex items-center justify-center w-11 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap ${t.direction === "BUY" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          }`}>
          {t.direction}
        </span>
      </div>
    </td>

    {/* 2. Entry / Exit Time */}
    <td className="py-3 w-[12%] text-left whitespace-nowrap text-xs text-slate-500 font-sans">
      {t.entry_time ? `${t.entry_time} - ${t.exit_time || "—"}` : "—"}
    </td>

    {/* 3. Entry / Exit Price */}
    <td className="py-3 w-[15%] text-left whitespace-nowrap text-xs text-slate-600">
      <div><span className="text-slate-400">In:</span> ₹{t.entry_price.toFixed(2)}</div>
      {t.exit_price ? (
        <div><span className="text-slate-400">Out:</span> ₹{t.exit_price.toFixed(2)}</div>
      ) : (
        <div className="text-emerald-600 font-semibold">OPEN</div>
      )}
    </td>

    {/* 4. Lots */}
    <td className="py-3 w-[7%] text-left whitespace-nowrap text-sm text-slate-600">
      {t.quantity} lots
    </td>

    {/* 5. P&L */}
    <td className="py-3 w-[10%] text-left whitespace-nowrap">
      <div className={`font-bold text-sm ${t.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {t.pnl >= 0 ? "+" : ""}₹{t.pnl?.toFixed(2)}
      </div>
      <div className="text-[10px] text-slate-400 font-sans">
        {t.pnl >= 0 ? "PROFIT" : "LOSS"}
      </div>
    </td>

    {/* 6. Strategy */}
    <td className="py-3 pr-4 w-[17%] text-left">
      {t.strategy ? (
        <span className="inline-block max-w-full bg-violet-100 text-violet-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-violet-200 break-words whitespace-normal" title={t.strategy}>
          {t.strategy}
        </span>
      ) : (
        <span className="text-slate-300">—</span>
      )}
    </td>

    {/* 7. Notes */}
    <td className="py-3 w-[21%] text-left">
      <span className="text-slate-700 font-medium text-sm break-words whitespace-normal block" title={t.notes}>
        {t.notes || "—"}
      </span>
    </td>

    {/* 8. Action (Edit & Delete) */}
    <td className="py-3 text-right w-[4%] whitespace-nowrap">
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={() => handleEditTrade(t)} className="text-slate-300 hover:text-violet-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleDeleteTrade(t.id)} className="text-slate-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  </tr>
);

// ─── Section wrapper (Stocks / Options / Futures) ─────────────────────────────
const AssetSection = ({ icon, title, trades, RowComponent, handleDeleteTrade, handleEditTrade }) => (
  <div className="space-y-2">
    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
      {icon}
      {title} ({trades.length})
    </h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-slate-700 table-fixed min-w-[850px]">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs text-left">
            <th className="py-2.5 w-[14%] font-semibold uppercase tracking-wider">
              {title === "Stocks" ? "Stock Name" : title === "Options" ? "Option Name" : "Future Name"}
            </th>
            <th className="py-2.5 w-[12%] font-semibold uppercase tracking-wider">Entry/Exit Time</th>
            <th className="py-2.5 w-[15%] font-semibold uppercase tracking-wider">Entry/Exit Price</th>
            <th className="py-2.5 w-[7%] font-semibold uppercase tracking-wider">Qty</th>
            <th className="py-2.5 w-[10%] font-semibold uppercase tracking-wider">P/L</th>
            <th className="py-2.5 pr-4 w-[17%] font-semibold uppercase tracking-wider">Strategy</th>
            <th className="py-2.5 w-[21%] font-semibold uppercase tracking-wider">Notes</th>
            <th className="py-2.5 w-[4%] text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
          {trades.map((t) => (
            <RowComponent key={t.id} t={t} handleDeleteTrade={handleDeleteTrade} handleEditTrade={handleEditTrade} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Main TradeHistory component ──────────────────────────────────────────────
const TradeHistory = ({
  groupedHistory,
  historyPeriod,
  setHistoryPeriod,
  historyAssetClass,
  setHistoryAssetClass,
  customDate,
  setCustomDate,
  customMonth,
  setCustomMonth,
  formatDateLabel,
  handleDeleteTrade,
}) => {
  const [editingTrade, setEditingTrade] = useState(null);
  const periodPresets = [
    { key: "TODAY", label: "Today" },
    { key: "MONTH", label: "This Month" },
    { key: "CUSTOM_DATE", label: "Custom Date" },
    { key: "CUSTOM_MONTH", label: "Custom Month" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 light-scroll">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trade History</h1>
          <p className="text-slate-500 text-xs">Review historical trades day-by-day grouped by Stocks, Options, and Futures.</p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm text-left">

        {/* Period presets */}
        <div className="flex flex-wrap items-center gap-2">
          {periodPresets.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setHistoryPeriod(key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${historyPeriod === key
                ? "bg-black border-black text-white"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date pickers + Asset Class filter */}
        <div className="flex items-center gap-2">
          {historyPeriod === "CUSTOM_DATE" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none shadow-sm"
            />
          )}
          {historyPeriod === "CUSTOM_MONTH" && (
            <input
              type="month"
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
              className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none shadow-sm"
            />
          )}
          <select
            value={historyAssetClass}
            onChange={(e) => setHistoryAssetClass(e.target.value)}
            className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none shadow-sm font-bold"
          >
            <option value="ALL">ALL ASSET CLASSES</option>
            <option value="STOCKS">STOCKS ONLY</option>
            <option value="OPTIONS">OPTIONS ONLY</option>
            <option value="FUTURES">FUTURES ONLY</option>
          </select>
        </div>
      </div>

      {/* Day-grouped trade cards */}
      {Object.keys(groupedHistory).length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm font-bold shadow-sm">
          No trades logged for the selected filters.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([dateKey, dayTrades]) => {
            const dailyTradesCount = dayTrades.length;
            const dailyPnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

            const stocksList = dayTrades.filter((t) => (t.asset_class?.toUpperCase() || "STOCKS") === "STOCKS");
            const optionsList = dayTrades.filter((t) => (t.asset_class?.toUpperCase() || "STOCKS") === "OPTIONS");
            const futuresList = dayTrades.filter((t) => (t.asset_class?.toUpperCase() || "STOCKS") === "FUTURES");

            return (
              <div key={dateKey} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-left">

                {/* Day Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon className="w-4.5 h-4.5 text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-800">{formatDateLabel(dateKey)}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500 font-semibold">
                      {dailyTradesCount} trade{dailyTradesCount !== 1 ? "s" : ""} logged
                    </span>
                    <span className={`font-extrabold font-mono text-sm px-2.5 py-0.5 rounded-full ${dailyPnl >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                      P&L: {dailyPnl >= 0 ? "+" : ""}₹{dailyPnl.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-5 space-y-6">
                  {stocksList.length > 0 && (
                    <AssetSection
                      icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                      title="Stocks"
                      trades={stocksList}
                      RowComponent={StocksRow}
                      handleDeleteTrade={handleDeleteTrade}
                      handleEditTrade={setEditingTrade}
                    />
                  )}
                  {optionsList.length > 0 && (
                    <AssetSection
                      icon={<Tag className="w-3.5 h-3.5 text-violet-600" />}
                      title="Options"
                      trades={optionsList}
                      RowComponent={OptionsRow}
                      handleDeleteTrade={handleDeleteTrade}
                      handleEditTrade={setEditingTrade}
                    />
                  )}
                  {futuresList.length > 0 && (
                    <AssetSection
                      icon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
                      title="Futures"
                      trades={futuresList}
                      RowComponent={FuturesRow}
                      handleDeleteTrade={handleDeleteTrade}
                      handleEditTrade={setEditingTrade}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Trade Modal Overlay */}
      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
        />
      )}
    </div>
  );
};

// ─── Edit Trade Modal Component ──────────────────────────────────────────────
const EditTradeModal = ({ trade, onClose }) => {
  const [symbol, setSymbol] = useState(trade.symbol || "");
  const [strategy, setStrategy] = useState(trade.strategy || "");
  const [notes, setNotes] = useState(trade.notes || "");
  const [entryTime, setEntryTime] = useState(trade.entry_time || "");
  const [exitTime, setExitTime] = useState(trade.exit_time || "");
  const updateTradeMutation = useUpdateTradeMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) {
      toast.error("Symbol is required.");
      return;
    }
    try {
      await updateTradeMutation.mutateAsync({
        id: trade.id,
        tradeData: {
          symbol: symbol.trim().toUpperCase(),
          strategy: strategy || null,
          notes: notes || null,
          entry_time: entryTime || null,
          exit_time: exitTime || null,
        },
      });
      toast.success("Trade details updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update trade.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 overflow-hidden animate-zoom-in text-left space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Edit Trade Details</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">Update parameters, times, strategy tags and review notes for this trade.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Symbol / Scrip</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. NIFTY50"
              className="bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-semibold font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Entry Time (HH:MM)</label>
              <input
                type="text"
                placeholder="e.g. 09:15"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                maxLength={5}
                className="bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Exit Time (HH:MM)</label>
              <input
                type="text"
                placeholder="e.g. 15:30"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                maxLength={5}
                className="bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-semibold font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-semibold">Strategy / Setup</label>
            <input
              type="text"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="e.g. Breakout, Pullback"
              className="bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-semibold"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-semibold">Execution Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record your entry reason, emotions, or mistakes..."
              rows={4}
              className="bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-650 font-semibold hover:bg-slate-50 rounded-xl text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTradeMutation.isPending}
              className="px-5 py-2 bg-black hover:bg-neutral-850 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              {updateTradeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeHistory;
