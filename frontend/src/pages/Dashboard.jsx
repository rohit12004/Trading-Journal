import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  useTradesQuery,
  useMetricsQuery,
  useLotSizesQuery,
  useCreateTradeMutation,
  useUpdateTradeMutation,
  useDeleteTradeMutation,
} from "../hooks/useTradingQuery";
import { toast } from "sonner";
import client from "../api/client";

// Layout & Tab Components
import Sidebar from "../components/Sidebar";
import DashboardOverview from "../components/DashboardOverview";
import TradeLogger from "../components/TradeLogger";
import TradeImporter from "../components/TradeImporter";
import TodayTradesTable from "../components/TodayTradesTable";
import TradeHistory from "../components/TradeHistory";
import ProfileSettings from "../components/ProfileSettings";
import TradingCalendar from "../components/TradingCalendar";
import AICoach from "../components/AICoach";

// ─── Initial form state ───────────────────────────────────────────────────────
const DEFAULT_TRADE_FORM = {
  symbol: "",
  direction: "BUY",
  entryPrice: "",
  quantity: "",
  status: "PROFIT",
  assetClass: "STOCKS",
  exitPrice: "",
  strikePrice: "",
  pnlAmount: "",
  commission: "",
  date: new Date().toISOString().split("T")[0],
  entryTime: "",
  exitTime: "",
  strategy: "",
  notes: "",
};

// ─── Dashboard orchestrator ───────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout, updateProfile } = useAuthStore();

  // ── Server state ──────────────────────────────────────────────────────────
  const { data: trades = [] } = useTradesQuery();
  const { data: metrics = { net_pnl: 0, win_rate: 0, profit_factor: 0, total_trades: 0, open_trades_count: 0 } } = useMetricsQuery();
  const { data: lotSizes = {} } = useLotSizesQuery();

  const createTradeMutation = useCreateTradeMutation();
  const updateTradeMutation = useUpdateTradeMutation();
  const deleteTradeMutation = useDeleteTradeMutation();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [tradeMode, setTradeMode] = useState("MANUAL"); // MANUAL or IMPORT

  // History filters
  const [historyPeriod, setHistoryPeriod]         = useState("TODAY");
  const [historyAssetClass, setHistoryAssetClass] = useState("ALL");
  const [customDate, setCustomDate]               = useState(new Date().toISOString().split("T")[0]);
  const [customMonth, setCustomMonth]             = useState(new Date().toISOString().slice(0, 7));

  // Trade log form
  const [tradeForm, setTradeForm] = useState(DEFAULT_TRADE_FORM);

  // Position closing
  const [closingTradeId, setClosingTradeId]   = useState(null);
  const [exitPriceInput, setExitPriceInput]   = useState("");

  // Cookie test panel
  const [cookieStatus, setCookieStatus]   = useState("");
  const [cookieLoading, setCookieLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName:    user?.first_name    || "",
    middleName:   user?.middle_name   || "",
    lastName:     user?.last_name     || "",
    addressLine1: user?.address_line1 || "",
    city:         user?.city          || "",
    state:        user?.state         || "",
    country:      user?.country       || "",
    postal_code:  user?.postal_code   || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Sync profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName:    user.first_name    || "",
        middleName:   user.middle_name   || "",
        lastName:     user.last_name     || "",
        addressLine1: user.address_line1 || "",
        city:         user.city          || "",
        state:        user.state         || "",
        country:      user.country       || "",
        postal_code:  user.postal_code   || "",
      });
    }
  }, [user]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getFullName = () => {
    if (!user) return "Trader Profile";
    const middle = user.middle_name ? ` ${user.middle_name}` : "";
    const last   = user.last_name   ? ` ${user.last_name}`   : "";
    return `${user.first_name}${middle}${last}`;
  };

  const getTradeLocalDateStr = (t) =>
    t.timestamp ? t.timestamp.split("T")[0] : t.created_at ? t.created_at.split("T")[0] : "Unknown Date";

  const formatDateLabel = (dateStr) => {
    if (dateStr === "Unknown Date") return dateStr;
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const todayStr    = new Date().toISOString().split("T")[0];
  const todayTrades = trades.filter((t) => getTradeLocalDateStr(t) === todayStr);
  const todayPnl    = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  const getFilteredTrades = () =>
    trades.filter((t) => {
      const tradeDate = getTradeLocalDateStr(t);
      if (historyPeriod === "TODAY"        && tradeDate !== todayStr)          return false;
      if (historyPeriod === "MONTH"        && !tradeDate.startsWith(new Date().toISOString().slice(0, 7))) return false;
      if (historyPeriod === "CUSTOM_DATE"  && tradeDate !== customDate)        return false;
      if (historyPeriod === "CUSTOM_MONTH" && !tradeDate.startsWith(customMonth)) return false;
      if (historyAssetClass !== "ALL") {
        const asset = t.asset_class?.toUpperCase() || "STOCKS";
        if (asset !== historyAssetClass) return false;
      }
      return true;
    });

  const groupTradesByDay = (list) => {
    const sorted = [...list].sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));
    return sorted.reduce((groups, t) => {
      const key = getTradeLocalDateStr(t);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
      return groups;
    }, {});
  };

  const groupedHistory = groupTradesByDay(getFilteredTrades());

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogTradeSubmit = async (e) => {
    e.preventDefault();
    const { symbol, quantity, direction, assetClass, entryPrice, exitPrice, strikePrice, date, entryTime, exitTime, strategy, notes } = tradeForm;

    if (!symbol || !quantity) {
      toast.error("Please fill in all required trade fields.");
      return;
    }

    if (parseFloat(quantity) <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }

    if (parseFloat(entryPrice) <= 0) {
      toast.error("Entry price must be greater than 0.");
      return;
    }

    if (exitPrice && parseFloat(exitPrice) < 0) {
      toast.error("Exit price cannot be negative.");
      return;
    }

    if (strikePrice && parseFloat(strikePrice) < 0) {
      toast.error("Strike price cannot be negative.");
      return;
    }

    try {
      const payload = {
        symbol:      symbol.toUpperCase(),
        direction,
        quantity:    parseFloat(quantity),
        asset_class: assetClass,
        entry_time:  entryTime  || null,
        exit_time:   exitTime   || null,
        strategy:    strategy   || null,
        notes:       notes      || null,
        entry_price: parseFloat(entryPrice),
        exit_price:  parseFloat(exitPrice),
        timestamp:   date ? `${date}T${entryTime || "00:00"}:00` : null,
      };
      if (assetClass === "OPTIONS") {
        payload.strike_price = strikePrice ? parseFloat(strikePrice) : null;
      }

      await createTradeMutation.mutateAsync(payload);
      toast.success("Trade position logged successfully!");

      setTradeForm({
        ...DEFAULT_TRADE_FORM,
        direction:  assetClass === "OPTIONS" ? "CALL" : "BUY",
        assetClass,
      });
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to log trade.");
      return false;
    }
  };

  const handleClosePositionSubmit = async (e) => {
    e.preventDefault();
    if (!exitPriceInput) return;
    try {
      await updateTradeMutation.mutateAsync({
        id: closingTradeId,
        tradeData: { status: "CLOSED", exit_price: parseFloat(exitPriceInput) },
      });
      setClosingTradeId(null);
      setExitPriceInput("");
      toast.success("Position closed successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to close position.");
    }
  };

  const handleDeleteTrade = async (id) => {
    try {
      await deleteTradeMutation.mutateAsync(id);
      toast.success("Trade deleted successfully.");
    } catch {
      toast.error("Failed to delete trade.");
    }
  };

  const handleCalendarDayClick = (dateStr) => {
    setHistoryPeriod("CUSTOM_DATE");
    setCustomDate(dateStr);
    setActiveTab("History");
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile({
        first_name:   profileForm.firstName,
        middle_name:  profileForm.middleName  || null,
        last_name:    profileForm.lastName    || null,
        address_line1: profileForm.addressLine1 || null,
        city:         profileForm.city        || null,
        state:        profileForm.state       || null,
        country:      profileForm.country     || null,
        postal_code:  profileForm.postal_code || null,
      });
      toast.success("Profile and billing address updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCookieRotation = async () => {
    setCookieLoading(true);
    setCookieStatus("");
    try {
      setCookieStatus("Requesting backend to delete access_token cookie...");
      await client.post("/auth/test-expire");
      setCookieStatus("Access token cleared. Making protected API call (/auth/me)...");
      await client.get("/auth/me");
      setCookieStatus("Success! Token rotated seamlessly.\nAxios interceptor caught 401, refreshed cookie automatically, and retried the call.");
    } catch (err) {
      console.error(err);
      setCookieStatus("Rotation test failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setCookieLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans">

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        getFullName={getFullName}
        logout={logout}
      />

      <main className="flex-1 h-full bg-slate-50 flex flex-col overflow-hidden">

        {/* Tab A — Dashboard Overview */}
        {activeTab === "Dashboard" && (
          <DashboardOverview
            trades={trades}
          />
        )}

        {/* Tab B — Log Trades */}
        {activeTab === "Trades" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 light-scroll">
            <div className="pb-4 border-b border-slate-200 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Log Day Trades</h1>
                <p className="text-slate-500 text-xs">Record completed or open trade executions for today.</p>
              </div>

              {/* Mode Switcher Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner gap-0.5 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setTradeMode("MANUAL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tradeMode === "MANUAL"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setTradeMode("IMPORT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tradeMode === "IMPORT"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Import Report
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {tradeMode === "MANUAL" ? (
                <TradeLogger
                  tradeForm={tradeForm}
                  setTradeForm={setTradeForm}
                  lotSizes={lotSizes}
                  handleLogTradeSubmit={handleLogTradeSubmit}
                />
              ) : (
                <div className="lg:col-span-5">
                  <TradeImporter />
                </div>
              )}
              <TodayTradesTable
                todayTrades={todayTrades}
                todayPnl={todayPnl}
                handleDeleteTrade={handleDeleteTrade}
              />
            </div>
          </div>
        )}

        {/* Tab C — Trade History */}
        {activeTab === "History" && (
          <TradeHistory
            groupedHistory={groupedHistory}
            historyPeriod={historyPeriod}
            setHistoryPeriod={setHistoryPeriod}
            historyAssetClass={historyAssetClass}
            setHistoryAssetClass={setHistoryAssetClass}
            customDate={customDate}
            setCustomDate={setCustomDate}
            customMonth={customMonth}
            setCustomMonth={setCustomMonth}
            formatDateLabel={formatDateLabel}
            handleDeleteTrade={handleDeleteTrade}
          />
        )}

        {/* Tab E — Trading Calendar */}
        {activeTab === "Calendar" && (
          <TradingCalendar
            trades={trades}
            onDayClick={handleCalendarDayClick}
          />
        )}

        {/* Tab F — AI Coach & Journal */}
        {activeTab === "AICoach" && (
          <div className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col">
            <AICoach />
          </div>
        )}

        {/* Tab D — Profile & Settings */}
        {activeTab === "Profile & Settings" && (
          <ProfileSettings
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            profileLoading={profileLoading}
            user={user}
            handleProfileSave={handleProfileSave}
          />
        )}

      </main>
    </div>
  );
};

export default Dashboard;
