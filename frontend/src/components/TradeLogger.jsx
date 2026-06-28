import React from "react";
import { Plus } from "lucide-react";
import { useRefineNotesMutation } from "../hooks/useAIQuery";

const TradeLogger = ({ tradeForm, setTradeForm, lotSizes, handleLogTradeSubmit }) => {
  const refineMutation = useRefineNotesMutation();

  const handleRefineNotes = async () => {
    if (!tradeForm.notes || !tradeForm.notes.trim()) return;
    try {
      const response = await refineMutation.mutateAsync(tradeForm.notes);
      if (response && response.refined_notes) {
        update({ notes: response.refined_notes });
      }
    } catch (err) {
      console.error("Failed to refine notes:", err);
    }
  };
  const update = (fields) => setTradeForm((prev) => ({ ...prev, ...fields }));

  return (
    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 flex-shrink-0">
        Trade Parameter Details
      </h3>

      <form onSubmit={handleLogTradeSubmit} className="space-y-3.5 mt-3 flex-1 text-left">

        {/* Asset Class */}
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Asset Class *</label>
          <select
            value={tradeForm.assetClass}
            onChange={(e) => {
              const selectedClass = e.target.value;
              update({
                assetClass: selectedClass,
                direction: selectedClass === "OPTIONS" ? "CALL" : "BUY",
                entryPrice: "",
                exitPrice: "",
                strikePrice: "",
                pnlAmount: "",
                status: "PROFIT",
              });
            }}
            className="bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none shadow-sm"
          >
            <option value="STOCKS">STOCKS (Shares)</option>
            <option value="OPTIONS">OPTIONS (Contracts)</option>
            <option value="FUTURES">FUTURES (Lots)</option>
          </select>
        </div>

        {/* Symbol & Direction Row */}
        <div className="grid grid-cols-2 gap-3">

          {/* Symbol */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Symbol *</label>
            {tradeForm.assetClass === "STOCKS" ? (
              <input
                type="text"
                value={tradeForm.symbol}
                onChange={(e) => update({ symbol: e.target.value })}
                placeholder="e.g. Reliance, TCS"
                className="bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-1.5 text-xs text-black uppercase outline-none placeholder-slate-400 shadow-sm"
                required
              />
            ) : (
              <div className="space-y-1.5">
                <select
                  value={
                    Object.keys(lotSizes).includes(tradeForm.symbol)
                      ? tradeForm.symbol
                      : tradeForm.symbol === "" ? "" : "CUSTOM"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ symbol: val === "CUSTOM" ? "CUSTOM_VAL" : val });
                  }}
                  className="w-full bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none shadow-sm"
                  required
                >
                  <option value="" disabled>Select Symbol</option>
                  {Object.entries(lotSizes).map(([sym, size]) => (
                    <option key={sym} value={sym}>{sym} ({size})</option>
                  ))}
                  <option value="CUSTOM">Custom Stock / Other...</option>
                </select>

                {(tradeForm.symbol === "CUSTOM_VAL" ||
                  (tradeForm.symbol !== "" && !Object.keys(lotSizes).includes(tradeForm.symbol))) && (
                  <input
                    type="text"
                    value={tradeForm.symbol === "CUSTOM_VAL" ? "" : tradeForm.symbol}
                    onChange={(e) => update({ symbol: e.target.value })}
                    placeholder="e.g. RELIANCE"
                    className="w-full bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-1.5 text-xs text-black uppercase outline-none placeholder-slate-400 shadow-sm"
                    required
                  />
                )}
              </div>
            )}
          </div>

          {/* Direction / Option Type */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              {tradeForm.assetClass === "OPTIONS" ? "Option Type *" : "Direction *"}
            </label>
            {tradeForm.assetClass === "OPTIONS" ? (
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: "CALL", label: "CALL CE", active: "bg-emerald-50 border-emerald-500 text-emerald-700" },
                  { value: "PUT",  label: "PUT CE",  active: "bg-red-50 border-red-500 text-red-700" },
                ].map(({ value, label, active }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ direction: value })}
                    className={`py-1 rounded-lg text-xs font-bold transition-all border ${
                      tradeForm.direction === value ? active : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: "BUY",  label: "BUY (Long)",  active: "bg-emerald-50 border-emerald-500 text-emerald-700" },
                  { value: "SELL", label: "SELL (Short)", active: "bg-red-50 border-red-500 text-red-700" },
                ].map(({ value, label, active }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ direction: value })}
                    className={`py-1 rounded-lg text-xs font-bold transition-all border ${
                      tradeForm.direction === value ? active : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* F&O Fields */}
        {tradeForm.assetClass !== "STOCKS" ? (
          <>
            {/* Strike Price (Options) & Quantity (Lots) */}
            <div className="grid grid-cols-2 gap-3">
              {tradeForm.assetClass === "OPTIONS" ? (
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Strike Price</label>
                  <input
                    type="number" step="any" min="0"
                    value={tradeForm.strikePrice}
                    onChange={(e) => update({ strikePrice: e.target.value })}
                    placeholder="22000"
                    className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Quantity (Lots) *</label>
                  <input
                    type="number" step="1" min="1"
                    value={tradeForm.quantity}
                    onChange={(e) => update({ quantity: e.target.value })}
                    placeholder="1"
                    className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                    required
                  />
                </div>
              )}
              {tradeForm.assetClass === "OPTIONS" && (
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Quantity (Lots) *</label>
                  <input
                    type="number" step="1" min="1"
                    value={tradeForm.quantity}
                    onChange={(e) => update({ quantity: e.target.value })}
                    placeholder="1"
                    className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                    required
                  />
                </div>
              )}
            </div>

            {/* Entry & Exit Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Entry Price *</label>
                <input
                  type="number" step="any" min="0.0001"
                  value={tradeForm.entryPrice}
                  onChange={(e) => update({ entryPrice: e.target.value })}
                  placeholder={tradeForm.assetClass === "OPTIONS" ? "Premium at entry" : "Future entry price"}
                  className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Exit Price *</label>
                <input
                  type="number" step="any" min="0"
                  value={tradeForm.exitPrice}
                  onChange={(e) => update({ exitPrice: e.target.value })}
                  placeholder={tradeForm.assetClass === "OPTIONS" ? "Premium at exit" : "Future exit price"}
                  className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                  required
                />
              </div>
            </div>

          </>
        ) : (
          <>
            {/* Stocks Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Entry Price *</label>
                <input
                  type="number" step="any" min="0.0001"
                  value={tradeForm.entryPrice}
                  onChange={(e) => update({ entryPrice: e.target.value })}
                  placeholder="185.20"
                  className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Exit Price *</label>
                <input
                  type="number" step="any" min="0"
                  value={tradeForm.exitPrice}
                  onChange={(e) => update({ exitPrice: e.target.value })}
                  placeholder="192.50"
                  className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Quantity (Shares) *</label>
                <input
                  type="number" step="1" min="1"
                  value={tradeForm.quantity}
                  onChange={(e) => update({ quantity: e.target.value })}
                  placeholder="100"
                  className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Broker Commission</label>
                <input
                  type="number" step="any" min="0"
                  value={tradeForm.commission}
                  onChange={(e) => update({ commission: e.target.value })}
                  placeholder="0.00"
                  className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
                />
              </div>
            </div>
          </>
        )}

        {/* Entry Time & Exit Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Entry Time</label>
            <input
              type="time"
              value={tradeForm.entryTime}
              onChange={(e) => update({ entryTime: e.target.value })}
              className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Exit Time</label>
            <input
              type="time"
              value={tradeForm.exitTime}
              onChange={(e) => update({ exitTime: e.target.value })}
              className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Strategy */}
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Strategy Used</label>
          <input
            type="text"
            value={tradeForm.strategy}
            onChange={(e) => update({ strategy: e.target.value })}
            placeholder="e.g. VWAP Breakout, EMA Crossover, Scalp..."
            maxLength={100}
            className="bg-white border border-slate-200 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-black outline-none shadow-sm placeholder-slate-400"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Notes &amp; Learnings</label>
            {tradeForm.notes && tradeForm.notes.trim() && (
              <button
                type="button"
                onClick={handleRefineNotes}
                disabled={refineMutation.isPending}
                className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5 transition-colors disabled:opacity-50"
              >
                {refineMutation.isPending ? (
                  <>
                    <span className="animate-spin inline-block w-2.5 h-2.5 border-t-2 border-violet-600 rounded-full" style={{ borderRightColor: 'transparent' }}></span>
                    Refining...
                  </>
                ) : (
                  <>✨ Refine with AI</>
                )}
              </button>
            )}
          </div>
          <textarea
            value={tradeForm.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Identify breakout triggers, rules followed, psychological notes..."
            className="bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs text-black outline-none h-20 resize-none placeholder-slate-400 shadow-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-black hover:bg-neutral-850 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log Day Trade
        </button>
      </form>
    </div>
  );
};

export default TradeLogger;
