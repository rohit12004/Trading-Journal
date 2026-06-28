import { create } from "zustand";
import client from "../api/client";

export const useJournalStore = create((set, get) => ({
  accounts: [],
  activeAccount: null, // Selected account object
  trades: [],
  metrics: {
    net_pnl: 0,
    win_rate: 0,
    profit_factor: 0,
    total_trades: 0,
    open_trades_count: 0
  },
  loading: false,

  fetchAccounts: async () => {
    set({ loading: true });
    try {
      const response = await client.get("/accounts/");
      const accounts = response.data;
      set({ accounts, loading: false });
      
      // Auto-set activeAccount to the first account if none is set
      if (accounts.length > 0 && !get().activeAccount) {
        set({ activeAccount: accounts[0] });
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      set({ loading: false });
    }
  },

  setActiveAccount: (account) => {
    set({ activeAccount: account });
    // Refetch trades and metrics for the newly selected account
    get().fetchTrades();
    get().fetchMetrics();
  },

  createAccount: async (broker, name) => {
    const response = await client.post("/accounts/", {
      broker,
      account_name: name
    });
    await get().fetchAccounts();
    // If it was the first account created, make it active
    const accounts = get().accounts;
    if (accounts.length === 1) {
      get().setActiveAccount(accounts[0]);
    }
    return response.data;
  },

  updateAccount: async (id, broker, name) => {
    const response = await client.put(`/accounts/${id}`, {
      broker,
      account_name: name
    });
    await get().fetchAccounts();
    
    // Update activeAccount state if it was the edited one
    const active = get().activeAccount;
    if (active && active.id === id) {
      set({ activeAccount: response.data });
    }
    return response.data;
  },

  deleteAccount: async (id) => {
    await client.delete(`/accounts/${id}`);
    
    // Clear activeAccount if it got deleted
    const active = get().activeAccount;
    if (active && active.id === id) {
      set({ activeAccount: null });
    }
    
    await get().fetchAccounts();
    
    const accounts = get().accounts;
    if (accounts.length > 0) {
      get().setActiveAccount(accounts[0]);
    } else {
      // Clear trades and stats if no accounts remain
      set({ 
        trades: [], 
        metrics: { net_pnl: 0, win_rate: 0, profit_factor: 0, total_trades: 0, open_trades_count: 0 } 
      });
    }
  },

  fetchTrades: async () => {
    const active = get().activeAccount;
    if (!active) {
      set({ trades: [] });
      return;
    }
    
    set({ loading: true });
    try {
      const response = await client.get("/trades/", {
        params: { account_id: active.id }
      });
      set({ trades: response.data, loading: false });
    } catch (error) {
      console.error("Failed to fetch trades:", error);
      set({ loading: false });
    }
  },

  createTrade: async (tradeData) => {
    const active = get().activeAccount;
    if (!active) throw new Error("No active trading account selected.");

    const response = await client.post("/trades/", {
      ...tradeData,
      account_id: active.id
    });
    
    await get().fetchTrades();
    await get().fetchMetrics();
    return response.data;
  },

  updateTrade: async (id, tradeData) => {
    const response = await client.put(`/trades/${id}`, tradeData);
    await get().fetchTrades();
    await get().fetchMetrics();
    return response.data;
  },

  deleteTrade: async (id) => {
    await client.delete(`/trades/${id}`);
    await get().fetchTrades();
    await get().fetchMetrics();
  },

  fetchMetrics: async () => {
    const active = get().activeAccount;
    if (!active) {
      set({ metrics: { net_pnl: 0, win_rate: 0, profit_factor: 0, total_trades: 0, open_trades_count: 0 } });
      return;
    }

    try {
      const response = await client.get("/trades/metrics", {
        params: { account_id: active.id }
      });
      set({ metrics: response.data });
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  }
}));
