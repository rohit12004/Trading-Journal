import React, { useState, useRef } from "react";
import { Upload, X, Check, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useImportPreviewMutation, useImportConfirmMutation } from "../hooks/useTradingQuery";

const TradeImporter = () => {
  const [broker, setBroker] = useState("GROWW");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewTrades, setPreviewTrades] = useState(null); // null or Array of parsed trades
  const [selectedIndices, setSelectedIndices] = useState(new Set()); // indices of selected trades

  const fileInputRef = useRef(null);

  const previewMutation = useImportPreviewMutation();
  const confirmMutation = useImportConfirmMutation();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
      setSelectedFile(file);
    } else {
      toast.error("Unsupported file type. Please upload a .xlsx, .xls, or .csv statement.");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleParseSubmit = async () => {
    if (!selectedFile) return;
    try {
      const data = await previewMutation.mutateAsync({
        broker,
        file: selectedFile,
      });
      if (data && data.length > 0) {
        setPreviewTrades(data);
        // Select all by default
        setSelectedIndices(new Set(data.map((_, idx) => idx)));
        toast.success(`Successfully parsed ${data.length} trades!`);
      } else {
        toast.error("No trades found in the uploaded file.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to parse broker statement.");
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIndices.size === previewTrades.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(previewTrades.map((_, idx) => idx)));
    }
  };

  const handleToggleSelectRow = (index) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleConfirmImport = async () => {
    if (selectedIndices.size === 0) {
      toast.error("Please select at least one trade to import.");
      return;
    }

    const tradesToImport = previewTrades.filter((_, idx) => selectedIndices.has(idx));

    try {
      await confirmMutation.mutateAsync(tradesToImport);
      toast.success(`Successfully imported ${tradesToImport.length} trades to your journal!`);
      setPreviewTrades(null);
      removeFile();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to confirm trade import.");
    }
  };

  const inputCls = "bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none";
  const labelCls = "text-xs font-bold text-slate-800";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[360px] h-auto text-left hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Import Broker Statement</h3>
        <p className="text-slate-500 text-[11px] mt-0.5 mb-4">Upload your trade report sheet to import records automatically.</p>

        <div className="space-y-4">
          {/* Broker Select */}
          <div className="flex flex-col space-y-1">
            <label className={labelCls}>Broker Statement Format</label>
            <select
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className={inputCls}
            >
              <option value="GROWW">Groww F&amp;O Report (.xlsx)</option>
            </select>
          </div>

          {/* Visibility Note */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-800 leading-normal flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Date &amp; Visibility Note:</span> Imported trades are automatically logged to their original execution dates from the statement. You can view them in the <strong className="text-amber-900">Trade History</strong> tab by selecting the corresponding date range (e.g., "This Month" or "Custom Date").
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={!selectedFile ? handleUploadClick : undefined}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center h-32 ${isDragActive ? "border-violet-500 bg-violet-50/10" : "border-slate-200 hover:border-violet-400 bg-slate-50/30"
              }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            {!selectedFile ? (
              <>
                <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                <span className="text-xs font-bold text-slate-700">Drag statement here or click to browse</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Supports Excel (.xlsx) and CSV reports</span>
              </>
            ) : (
              <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-sm max-w-full animate-fade-in">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 mt-auto">
        <button
          type="button"
          onClick={handleParseSubmit}
          disabled={!selectedFile || previewMutation.isPending}
          className={`w-full py-2.5 bg-black hover:bg-neutral-850 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${!selectedFile ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {previewMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Parsing report...
            </>
          ) : (
            "Analyze and Preview Trades"
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {previewTrades && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Confirm Broker Import</h3>
                <p className="text-slate-500 text-xs">Review parsed trades from your statement. Deselect any entries to skip them.</p>
              </div>
              <button
                onClick={() => setPreviewTrades(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Trade Table) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                      <th className="py-3 px-4 w-[6%] text-center">
                        <button
                          onClick={handleToggleSelectAll}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedIndices.size === previewTrades.length
                              ? "bg-violet-600 border-violet-600 text-white"
                              : "border-slate-300 bg-white"
                            }`}
                        >
                          {selectedIndices.size === previewTrades.length && <Check className="w-3 h-3" />}
                        </button>
                      </th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Instrument</th>
                      <th className="py-3 px-4">Asset</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-right">Lots</th>
                      <th className="py-3 px-4 text-right">Buy Avg</th>
                      <th className="py-3 px-4 text-right">Sell Avg</th>
                      <th className="py-3 px-4 text-right">Net P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {previewTrades.map((t, idx) => {
                      const isSelected = selectedIndices.has(idx);
                      const isProfit = t.pnl >= 0;
                      const dateStr = new Date(t.timestamp).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", year: "numeric"
                      });
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/40 transition-colors ${!isSelected ? "opacity-40 bg-slate-50/20" : ""}`}>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleSelectRow(idx)}
                              className={`w-4 h-4 rounded border flex items-center justify-center mx-auto transition-all ${isSelected
                                  ? "bg-violet-600 border-violet-600 text-white"
                                  : "border-slate-300 bg-white"
                                }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-medium font-mono">{dateStr}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{t.symbol}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-600">
                              {t.asset_class}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${t.direction === "CALL" || t.direction === "BUY"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-500"
                              }`}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold font-mono">{t.quantity.toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-600">₹{t.entry_price.toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-600">₹{t.exit_price.toFixed(2)}</td>
                          <td className={`py-2.5 px-4 text-right font-bold font-mono ${isProfit ? "text-emerald-600" : "text-rose-500"
                            }`}>
                            {isProfit ? "+" : ""}₹{t.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>Selected {selectedIndices.size} of {previewTrades.length} trades for import.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewTrades(null)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={confirmMutation.isPending || selectedIndices.size === 0}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-850 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  {confirmMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Confirm & Import ${selectedIndices.size} Trade${selectedIndices.size !== 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeImporter;
