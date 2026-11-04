import React, { useState, useRef, useEffect } from "react";
import { RefreshCw, Trash2, Plus, ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { toast } from "sonner";
import {
  useCapitalTransactionsQuery,
  useCreateCapitalTransactionMutation,
  useDeleteCapitalTransactionMutation,
} from "../hooks/useTradingQuery";

const ProfileSettings = ({ profileForm, setProfileForm, profileLoading, user, handleProfileSave }) => {
  const update = (fields) => setProfileForm((prev) => ({ ...prev, ...fields }));

  const inputCls = "bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none placeholder-slate-400";
  const labelCls = "text-xs font-bold text-slate-800";

  const [pinLoading, setPinLoading] = useState(false);
  const pinCacheRef = useRef({});
  const lastFetchedPinRef = useRef("");
  const debounceTimerRef = useRef(null);

  const fetchAddressFromPincode = async (code, manual = false) => {
    const clean = (code || "").trim().replace(/\s+/g, "");
    if (!clean || clean.length < 5) return;

    // Prevent duplicate network calls for the same PIN code unless manually clicked
    if (!manual && clean === lastFetchedPinRef.current) return;

    // Use cached response if already fetched
    if (pinCacheRef.current[clean]) {
      const cached = pinCacheRef.current[clean];
      update(cached);
      lastFetchedPinRef.current = clean;
      return;
    }

    // 1. Indian 6-digit PIN code via PostalPincode API
    if (/^\d{6}$/.test(clean)) {
      setPinLoading(true);
      lastFetchedPinRef.current = clean;
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
        const data = await res.json();
        if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const detectedCity = (po.Block && po.Block !== "NA") ? po.Block : (po.Name || "");
          const detectedDistrict = po.District || "";
          const detectedState = po.State || "";
          const detectedCountry = po.Country || "India";
          const resObj = {
            city: detectedCity,
            district: detectedDistrict,
            state: detectedState,
            country: detectedCountry,
          };
          pinCacheRef.current[clean] = resObj;
          update(resObj);
          toast.success(`Autofilled: ${detectedCity}, ${detectedDistrict}`);
        } else if (manual) {
          toast.error("No location found for this PIN code.");
        }
      } catch (err) {
        console.error("Postal PIN code lookup error:", err);
      } finally {
        setPinLoading(false);
      }
    } else if (/^\d{5}$/.test(clean)) {
      // 2. Global / US 5-digit ZIP code via Zippopotam API
      setPinLoading(true);
      lastFetchedPinRef.current = clean;
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.places?.length > 0) {
            const place = data.places[0];
            const resObj = {
              city: place["place name"] || "",
              district: "",
              state: place["state"] || "",
              country: data["country"] || "United States",
            };
            pinCacheRef.current[clean] = resObj;
            update(resObj);
            toast.success(`Autofilled: ${place["place name"]}, ${place["state"]}`);
          }
        }
      } catch (err) {
        console.error("ZIP code lookup error:", err);
      } finally {
        setPinLoading(false);
      }
    }
  };

  const getLocalDatetimeString = (date) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date - tzoffset).toISOString().slice(0, 16);
  };

  const [txType, setTxType] = useState("DEPOSIT");
  const [txAmount, setTxAmount] = useState("");
  const [txTimestamp, setTxTimestamp] = useState(getLocalDatetimeString(new Date()));
  const [txDescription, setTxDescription] = useState("");

  const { data: capitalTransactions = [] } = useCapitalTransactionsQuery();
  const createTxMutation = useCreateCapitalTransactionMutation();
  const deleteTxMutation = useDeleteCapitalTransactionMutation();

  const handleCapitalSubmit = async (e) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      await createTxMutation.mutateAsync({
        type: txType,
        amount: parseFloat(txAmount),
        timestamp: new Date(txTimestamp).toISOString(),
        description: txDescription || null,
      });
      toast.success(`${txType === "DEPOSIT" ? "Deposit" : "Withdrawal"} logged successfully!`);
      setTxAmount("");
      setTxDescription("");
      setTxTimestamp(getLocalDatetimeString(new Date()));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to log transaction.");
    }
  };

  const handleDeleteTx = async (id) => {
    try {
      await deleteTxMutation.mutateAsync(id);
      toast.success("Transaction deleted successfully.");
    } catch {
      toast.error("Failed to delete transaction.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 w-full text-left">

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Profile &amp; Address Settings</h1>
        <p className="text-slate-500 text-xs">Manage your personal details, email credentials, and billing address coordinates.</p>
      </div>

      <form onSubmit={handleProfileSave} className="space-y-6">

        {/* Personal Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Personal Info</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className={labelCls}>First Name *</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => update({ firstName: e.target.value })}
                placeholder="John"
                className={inputCls}
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className={labelCls}>Middle Name</label>
              <input
                type="text"
                value={profileForm.middleName}
                onChange={(e) => update({ middleName: e.target.value })}
                placeholder="Robert"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className={labelCls}>Last Name</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => update({ lastName: e.target.value })}
                placeholder="Doe"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className={labelCls}>Email Address (Primary Verification Contact)</label>
            <input
              type="email"
              value={user?.email || ""}
              className="bg-slate-100/60 border border-slate-200 text-slate-400 rounded-lg px-3 py-2 text-xs outline-none cursor-not-allowed"
              disabled
            />
            <p className="text-[10px] text-slate-400 mt-1">Verification contact emails cannot be changed.</p>
          </div>
        </div>

        {/* Billing Address Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Billing Address</h3>
            <span className="text-[11px] text-violet-600 font-medium hidden sm:inline">Auto-detects City &amp; State from PIN</span>
          </div>

          <div className="flex flex-col space-y-1">
            <label className={labelCls}>Address Line 1</label>
            <input
              type="text"
              value={profileForm.addressLine1}
              onChange={(e) => update({ addressLine1: e.target.value })}
              placeholder="123 Trading Boulevard, Suite 500"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2. Postal / PIN Code */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Postal / PIN Code</label>
                <span className="text-[10px] text-slate-400">e.g. 560001</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={10}
                  value={profileForm.postal_code}
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ postal_code: val });
                    const clean = val.trim().replace(/\s+/g, "");
                    // Clear previous debounce timer
                    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                    // Only fetch when exactly 6 digits (or 5 digits) and typing has paused
                    if (clean.length === 6 || clean.length === 5) {
                      debounceTimerRef.current = setTimeout(() => {
                        fetchAddressFromPincode(clean, false);
                      }, 500);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      fetchAddressFromPincode(profileForm.postal_code, true);
                    }
                  }}
                  placeholder="Enter PIN code"
                  className={`${inputCls} w-full pr-16`}
                />
                <div className="absolute right-1.5 flex items-center">
                  <button
                    type="button"
                    disabled={pinLoading || !profileForm.postal_code}
                    onClick={() => fetchAddressFromPincode(profileForm.postal_code, true)}
                    className="px-2 py-1 text-[10px] font-bold text-violet-600 hover:text-violet-750 bg-violet-50 hover:bg-violet-100 rounded-md transition-colors flex items-center gap-1 disabled:opacity-40"
                    title="Lookup city and district"
                  >
                    {pinLoading ? (
                      <RefreshCw className="w-3 h-3 text-violet-600 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-2.5 h-2.5" />
                        <span>Find</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. City / Town */}
            <div className="flex flex-col space-y-1">
              <label className={labelCls}>City / Town</label>
              <input
                type="text"
                value={profileForm.city}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="City / Town"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 4. District */}
            <div className="flex flex-col space-y-1">
              <label className={labelCls}>District</label>
              <input
                type="text"
                value={profileForm.district}
                onChange={(e) => update({ district: e.target.value })}
                placeholder="District"
                className={inputCls}
              />
            </div>

            {/* 5. State / Region */}
            <div className="flex flex-col space-y-1">
              <label className={labelCls}>State / Region</label>
              <input
                type="text"
                value={profileForm.state}
                onChange={(e) => update({ state: e.target.value })}
                placeholder="State / Region"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 6. Country */}
            <div className="flex flex-col space-y-1">
              <label className={labelCls}>Country</label>
              <input
                type="text"
                value={profileForm.country}
                onChange={(e) => update({ country: e.target.value })}
                placeholder="Country"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={profileLoading}
            className="px-6 py-2.5 bg-black hover:bg-neutral-850 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            {profileLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>

      {/* Trading Capital (Deposits & Withdrawals) Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Trading Capital Adjustments</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">Add deposits to set or top up your capital, or record withdrawals to cash out.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-4 space-y-4 border-r border-slate-100 pr-0 lg:pr-6">
            <div className="flex flex-col space-y-1">
              <label className={labelCls}>Adjustment Type</label>
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTxType("DEPOSIT")}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                    txType === "DEPOSIT" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Deposit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("WITHDRAWAL")}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all ${
                    txType === "WITHDRAWAL" ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Withdrawal (-)
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className={labelCls}>Amount (₹) *</label>
              <input
                type="number"
                step="any"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="e.g. 50000"
                className={inputCls}
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className={labelCls}>Date &amp; Time *</label>
              <input
                type="datetime-local"
                value={txTimestamp}
                onChange={(e) => setTxTimestamp(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className={labelCls}>Description / Notes</label>
              <input
                type="text"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="e.g. Initial balance, broker deposit"
                className={inputCls}
              />
            </div>

            <button
              type="button"
              onClick={handleCapitalSubmit}
              disabled={createTxMutation.isPending}
              className="w-full py-2 bg-black hover:bg-neutral-850 text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {createTxMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Log {txType === "DEPOSIT" ? "Deposit" : "Withdrawal"}
            </button>
          </div>

          {/* List History */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adjustment Audit History</h4>
            
            {capitalTransactions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-medium">No capital adjustments recorded yet.</p>
                <p className="text-slate-450 text-[10px] mt-1">Configure your starting trading funds to calculate your live balance.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-2.5 px-4">Date &amp; Time</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {capitalTransactions.map((tx) => {
                      const isDep = tx.type === "DEPOSIT";
                      const dateFormatted = new Date(tx.timestamp).toLocaleString(undefined, {
                        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                      });
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-600">{dateFormatted}</td>
                          <td className="py-2.5 px-4 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                              isDep ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                            }`}>
                              {isDep ? "Deposit" : "Withdrawal"}
                            </span>
                          </td>
                          <td className={`py-2.5 px-4 text-right font-bold font-mono ${
                            isDep ? "text-emerald-600" : "text-rose-500"
                          }`}>
                            {isDep ? "+" : "-"}₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 truncate max-w-[150px]" title={tx.description}>
                            {tx.description || <span className="italic text-slate-350">No notes</span>}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteTx(tx.id)}
                              disabled={deleteTxMutation.isPending}
                              className="text-slate-450 hover:text-red-500 p-1 rounded hover:bg-slate-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
