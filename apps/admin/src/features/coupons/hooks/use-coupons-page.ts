"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  fetchPromotions,
  updateCoupon,
} from "../api";
import { initialDraft, PAGE_SIZE } from "../constants";
import { buildCouponStats, filterCoupons, paginateCoupons } from "../helpers";
import type { CouponDraft, CouponRecord, PromotionOption, PromotionStatus, ViewMode } from "../types";

export function useCouponsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [promotions, setPromotions] = useState<PromotionOption[]>([]);
  const [stats, setStats] = useState(buildCouponStats([]));
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PromotionStatus>("ALL");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CouponDraft>(initialDraft());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CouponRecord | null>(null);

  const loadPromotions = async () => {
    try {
      const response = await fetchPromotions();
      setPromotions(response.promotions ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load promotions";
      setError(message);
    }
  };

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchCoupons();
      const list = response.coupons ?? [];
      setCoupons(list);
      setStats(buildCouponStats(list));
      setPage(1);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return;
      const message = err instanceof Error ? err.message : "Failed to load coupons";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPromotions();
    void loadCoupons();
  }, []);

  const filteredCoupons = useMemo(
    () => filterCoupons(coupons, searchInput, statusFilter),
    [coupons, searchInput, statusFilter],
  );

  const pagedCoupons = useMemo(
    () => paginateCoupons(filteredCoupons, page, PAGE_SIZE),
    [filteredCoupons, page],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setSelectedCoupon(null);
    setDraft(initialDraft());
    setViewMode("add");
  };

  const openEditModal = (coupon: CouponRecord) => {
    setEditingId(coupon.id);
    setSelectedCoupon(coupon);
    setDraft({
      code: coupon.code || "",
      promotionId: coupon.promotionId || "",
      discountPercentage: String(coupon.discountPercentage ?? ""),
      maxUsage: String(coupon.maxUsage ?? ""),
    });
    setViewMode("edit");
  };

  const openViewModal = (coupon: CouponRecord) => {
    setSelectedCoupon(coupon);
    setEditingId(null);
    setViewMode("view");
  };

  const closeModal = () => {
    setViewMode(null);
    setSelectedCoupon(null);
    setEditingId(null);
    setDraft(initialDraft());
  };

  const submitCoupon = async () => {
    const code = draft.code.trim().toUpperCase();
    const promotionId = draft.promotionId;
    const discountPercentage = Number(draft.discountPercentage);
    const maxUsage = Number(draft.maxUsage);

    if (!code) {
      setError("Coupon code is required.");
      return;
    }

    if (!promotionId) {
      setError("Please select a promotion.");
      return;
    }

    if (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage > 100) {
      setError("Discount percentage must be between 1 and 100.");
      return;
    }

    if (!Number.isFinite(maxUsage) || maxUsage < 1) {
      setError("Max usage must be at least 1.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        code,
        promotionId,
        discountPercentage,
        maxUsage,
      };

      if (editingId) {
        await updateCoupon(editingId, payload);
      } else {
        await createCoupon(payload);
      }

      await loadCoupons();
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save coupon";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const submitDeleteCoupon = async () => {
    if (!confirmDelete) return;

    setSaving(true);
    setError(null);

    try {
      await deleteCoupon(confirmDelete.id);
      setConfirmDelete(null);
      await loadCoupons();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete coupon";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return {
    state: {
      loading,
      saving,
      coupons,
      promotions,
      stats,
      searchInput,
      statusFilter,
      page,
      viewMode,
      selectedCoupon,
      editingId,
      draft,
      error,
      confirmDelete,
      filteredCoupons,
      pagedCoupons,
      totalPages,
    },
    actions: {
      setSearchInput,
      setStatusFilter,
      setPage,
      setViewMode,
      setSelectedCoupon,
      setEditingId,
      setDraft,
      setError,
      setConfirmDelete,
      loadPromotions,
      loadCoupons,
      openAddModal,
      openEditModal,
      openViewModal,
      closeModal,
      submitCoupon,
      submitDeleteCoupon,
    },
  };
}
