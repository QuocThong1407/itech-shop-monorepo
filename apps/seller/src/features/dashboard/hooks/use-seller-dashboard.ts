"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSellerDashboardData } from "../api";
import { buildDashboardViewModel, parseSellerUserId } from "../helpers";
import type { SellerDashboardData } from "../types";

const emptyData: SellerDashboardData = {
  orders: [],
  returns: [],
  cancellations: [],
  products: [],
};

export function useSellerDashboard() {
  const [sellerUserId, setSellerUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SellerDashboardData>(emptyData);

  useEffect(() => {
    setSellerUserId(parseSellerUserId());
  }, []);

  const loadDashboard = async (nextSellerUserId: string) => {
    if (!nextSellerUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchSellerDashboardData(nextSellerUserId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sellerUserId) return;
    void loadDashboard(sellerUserId);
  }, [sellerUserId]);

  const view = useMemo(() => buildDashboardViewModel(data), [data]);

  return {
    state: {
      sellerUserId,
      loading,
      error,
      data,
      view,
    },
    actions: {
      reload: () => loadDashboard(sellerUserId),
    },
  };
}
