"use client";

import { useEffect, useMemo, useState } from "react";
import { PAGE_SIZE, tabs } from "../constants";
import { fetchReturnDetail, fetchReturns, updateReturnStatus } from "../api";
import { buildReturnStats, filterReturns, paginateReturns } from "../helpers";
import type { ReturnRecord } from "../types";

export function useReturnsPage() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("ALL");
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReturnRecord | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchReturns();
      setRecords(result.returns || []);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load return requests.");
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
        const result = await fetchReturns();
        if (!mounted) return;
        setRecords(result.returns || []);
        setPage(1);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load return requests.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => buildReturnStats(records), [records]);

  const filteredRecords = useMemo(
    () => filterReturns(records, activeTab, searchText),
    [records, activeTab, searchText],
  );

  const pagedRecords = useMemo(
    () => paginateReturns(filteredRecords, page, PAGE_SIZE),
    [filteredRecords, page],
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const updateStatus = async (record: ReturnRecord, nextStatus: string) => {
    const confirm = window.confirm(`Update return request to ${nextStatus.toLowerCase()}?`);
    if (!confirm) return;

    setActionLoading(true);
    try {
      await updateReturnStatus(record.id, nextStatus);
      await loadReturns();
      if (selectedRecord?.id === record.id) {
        const detail = await fetchReturnDetail(record.id);
        setSelectedRecord(detail);
      }
    } catch {
      window.alert("Failed to update return status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleView = async (record: ReturnRecord) => {
    setLoading(true);
    try {
      const detail = await fetchReturnDetail(record.id);
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
      loadReturns,
      updateStatus,
      handleView,
    },
  };
}
