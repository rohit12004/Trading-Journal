import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

/* ============================
   TRADES
============================ */

export const useTradesQuery = () => {
  return useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const { data } = await client.get("/trades/");
      return data;
    },
  });
};

export const useMetricsQuery = () => {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const { data } = await client.get("/trades/metrics");
      return data;
    },
  });
};

export const useLotSizesQuery = () => {
  return useQuery({
    queryKey: ["lotSizes"],
    queryFn: async () => {
      const { data } = await client.get("/trades/lot-sizes");
      return data;
    },
  });
};

/* ============================
   TRADE MUTATIONS
============================ */

export const useCreateTradeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tradeData) => {
      const { data } = await client.post("/trades/", tradeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};

export const useUpdateTradeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tradeData }) => {
      const { data } = await client.put(`/trades/${id}`, tradeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};

export const useDeleteTradeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await client.delete(`/trades/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};

/* ============================
   CAPITAL TRANSACTIONS
============================ */

export const useCapitalTransactionsQuery = () => {
  return useQuery({
    queryKey: ["capitalTransactions"],
    queryFn: async () => {
      const { data } = await client.get("/capital-transactions/");
      return data;
    },
  });
};

export const useCreateCapitalTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (txData) => {
      const { data } = await client.post("/capital-transactions/", txData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capitalTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};

export const useDeleteCapitalTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await client.delete(`/capital-transactions/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capitalTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};

/* ============================
   BROKER IMPORTS
============================ */

export const useImportPreviewMutation = () => {
  return useMutation({
    mutationFn: async ({ broker, file }) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await client.post(`/imports/preview`, formData, {
        params: { broker },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
  });
};

export const useImportConfirmMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trades) => {
      const { data } = await client.post(`/imports/confirm`, trades);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
};