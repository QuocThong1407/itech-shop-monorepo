"use client";

import { useEffect, useMemo, useState } from "react";
import { PAGE_SIZE, paymentTabs, statusTabs } from "../constants";
import { fetchOrderDetail, fetchOrders, updateOrderStatus } from "../api";
import {
  buildOrderStats,
  filterOrders,
  getAddressText,
  normalizePaymentStatus,
  normalizeStatus,
  paginateOrders,
} from "../helpers";
import type { OrderRecord } from "../types";

export function useOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof statusTabs)[number]>("ALL");
  const [paymentTab, setPaymentTab] = useState<(typeof paymentTabs)[number]>("ALL");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);

    try {
      const result = await fetchOrders();
      setOrders(result.orders || []);
      setPage(1);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const result = await fetchOrders();
        if (!mounted) return;
        setOrders(result.orders || []);
        setPage(1);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load orders.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => buildOrderStats(orders), [orders]);

  const filteredOrders = useMemo(
    () => filterOrders(orders, activeTab, paymentTab, searchText),
    [activeTab, orders, paymentTab, searchText],
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const pagedOrders = useMemo(
    () => paginateOrders(filteredOrders, page, PAGE_SIZE),
    [filteredOrders, page],
  );

  const handleStatusChange = async (order: OrderRecord, nextStatus: string) => {
    if (normalizeStatus(order.status) === normalizeStatus(nextStatus)) {
      return;
    }

    const confirmed = window.confirm(`Change order status to ${nextStatus.toLowerCase()}?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await updateOrderStatus(order.id, nextStatus);
      await loadOrders();

      if (selectedOrder?.id === order.id) {
        const detail = await fetchOrderDetail(order.id);
        setSelectedOrder(detail);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update order status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleView = async (order: OrderRecord) => {
    setLoading(true);
    try {
      const detail = await fetchOrderDetail(order.id);
      setSelectedOrder(detail || order);
      setDetailOpen(true);
    } catch {
      setSelectedOrder(order);
      setDetailOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const customer = selectedOrder?.Customer?.User;
  const payment = selectedOrder?.Payment?.[0];
  const orderItems = selectedOrder?.OrderItem || [];
  const selectedAddress = selectedOrder ? getAddressText(selectedOrder) : "";

  return {
    state: {
      loading,
      actionLoading,
      searchText,
      activeTab,
      paymentTab,
      orders,
      detailOpen,
      selectedOrder,
      page,
      error,
      stats,
      filteredOrders,
      pagedOrders,
      totalPages,
      customer,
      payment,
      orderItems,
      selectedAddress,
    },
    actions: {
      setSearchText: (value: string) => {
        setSearchText(value);
        setPage(1);
      },
      setActiveTab: (tab: (typeof statusTabs)[number]) => {
        setActiveTab(tab);
        setPage(1);
      },
      setPaymentTab: (tab: (typeof paymentTabs)[number]) => {
        setPaymentTab(tab);
        setPage(1);
      },
      setDetailOpen,
      setSelectedOrder,
      setPage,
      loadOrders,
      handleStatusChange,
      handleView,
    },
    derived: {
      normalizeStatus,
      normalizePaymentStatus,
    },
  };
}
