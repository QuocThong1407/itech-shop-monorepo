"use client";

import { useEffect, useMemo, useState } from "react";
import { PAGE_SIZE, tabs } from "../constants";
import {
  fetchCancellationDetail,
  fetchCancellations,
  updateCancellationStatus,
} from "../api";
import {
  buildCancellationStats,
  filterCancellations,
  getStatusLabel,
  paginateCancellations,
} from "../helpers";
import type { CancellationRecord } from "../types";

export function useCancellationsPage() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("ALL");
  const [records, setRecords] = useState<CancellationRecord[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CancellationRecord | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadCancellations = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCancellations();
      setRecords(result.cancellations || []);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cancellation requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchCancellations();
        if (!mounted) return;
        setRecords(result.cancellations || []);
        setPage(1);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load cancellation requests.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => buildCancellationStats(records), [records]);

  const filteredRecords = useMemo(
    () => filterCancellations(records, activeTab, searchText),
    [records, activeTab, searchText],
  );

  const pagedRecords = useMemo(
    () => paginateCancellations(filteredRecords, page, PAGE_SIZE),
    [filteredRecords, page],
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const updateStatus = async (record: CancellationRecord, nextStatus: string) => {
    const confirm = window.confirm(
      `Update cancellation request to ${getStatusLabel(nextStatus)}?`,
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      await updateCancellationStatus(record.id, nextStatus);
      await loadCancellations();
      if (selectedRecord?.id === record.id) {
        const detail = await fetchCancellationDetail(record.id);
        setSelectedRecord(detail);
      }
    } catch {
      window.alert("Failed to update cancellation status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleView = async (record: CancellationRecord) => {
    setLoading(true);
    try {
      const detail = await fetchCancellationDetail(record.id);
      setSelectedRecord(detail || record);
      setDetailOpen(true);
    } catch {
      setSelectedRecord(record);
      setDetailOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const customer = selectedRecord?.Order?.Customer?.User;
  const payment = selectedRecord?.Order?.Payment?.[0];
  const items = selectedRecord?.Order?.OrderItem || [];

  return {
    state: {
      loading,
      actionLoading,
      searchText,
      activeTab,
      records,
      detailOpen,
      selectedRecord,
      page,
      error,
      stats,
      filteredRecords,
      pagedRecords,
      totalPages,
      customer,
      payment,
      items,
    },
    actions: {
      setSearchText,
      setActiveTab,
      setDetailOpen,
      setSelectedRecord,
      setPage,
      loadCancellations,
      updateStatus,
      handleView,
    },
  };
}
