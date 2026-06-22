"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyPromotionToCategories,
  applyPromotionToProducts,
  createPromotion,
  deletePromotion,
  fetchCategories,
  fetchProducts,
  fetchPromotionDetail,
  fetchPromotions,
  fetchPromotionStats,
  togglePromotionStatus,
  updatePromotion,
} from "../api";
import { initialDraft, PAGE_SIZE } from "../constants";
import {
  buildPromotionStats,
  filterPromotions,
  filterResourceItems,
  fromDateTimeLocal,
  getPromotionScope,
  paginatePromotions,
  toDateTimeLocal,
} from "../helpers";
import type {
  CatalogItem,
  DraftState,
  PromotionDetail,
  PromotionRecord,
  PromotionStatus,
  ScopeType,
  ViewMode,
} from "../types";

export function usePromotionsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [stats, setStats] = useState(buildPromotionStats(null));
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PromotionStatus>("ALL");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionDetail | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(initialDraft());
  const [resourceSearch, setResourceSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PromotionRecord | null>(null);
  const [promotionDetails, setPromotionDetails] = useState<Record<string, PromotionDetail>>({});

  const loadResources = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([fetchCategories(), fetchProducts()]);
      setCategories(categoriesData.categories ?? []);
      setProducts(productsData.products ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load catalog resources";
      setError(message);
    }
  };

  const loadPromotions = async () => {
    setLoading(true);
    setError(null);

    try {
      const [list, statSummary] = await Promise.all([
        fetchPromotions(searchQuery),
        fetchPromotionStats(),
      ]);

      setPromotions(list.promotions ?? []);
      setStats(buildPromotionStats(statSummary));
      setPage(1);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return;
      const message = err instanceof Error ? err.message : "Failed to load promotions";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
  }, []);

  useEffect(() => {
    void loadPromotions();
  }, [searchQuery]);

  const filteredPromotions = useMemo(
    () => filterPromotions(promotions, searchInput, statusFilter),
    [promotions, searchInput, statusFilter],
  );

  const pagedPromotions = useMemo(
    () => paginatePromotions(filteredPromotions, page, PAGE_SIZE),
    [filteredPromotions, page],
  );

  useEffect(() => {
    const loadVisibleDetails = async () => {
      const missing = pagedPromotions.filter((item) => !promotionDetails[item.id]);
      if (missing.length === 0) return;

      try {
        const details = await Promise.all(missing.map((item) => fetchPromotionDetail(item.id)));
        setPromotionDetails((current) => {
          const next = { ...current };
          details.forEach((detail) => {
            next[detail.id] = detail;
          });
          return next;
        });
      } catch {
        // Keep the table usable even if some detail requests fail.
      }
    };

    void loadVisibleDetails();
  }, [pagedPromotions, promotionDetails]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setSelectedPromotion(null);
    setResourceSearch("");
    setDraft(initialDraft());
    setViewMode("add");
  };

  const openEditModal = async (promotion: PromotionRecord) => {
    setSaving(false);
    setError(null);
    setEditingId(promotion.id);
    setViewMode("edit");
    setResourceSearch("");

    try {
      const detail = await fetchPromotionDetail(promotion.id);
      const scope = getPromotionScope(detail, categories.length);

      setSelectedPromotion(detail);
      setDraft({
        name: detail.name || "",
        description: detail.description || "",
        startDate: toDateTimeLocal(detail.startDate),
        endDate: toDateTimeLocal(detail.endDate),
        scopeType: scope.type,
        categoryIds: scope.categories.map((item) => item.id),
        productIds: scope.products.map((item) => item.id),
        image: null,
        preview: detail.image || "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load promotion";
      setError(message);
    }
  };

  const openViewModal = async (promotion: PromotionRecord) => {
    setError(null);
    try {
      const detail = await fetchPromotionDetail(promotion.id);
      setSelectedPromotion(detail);
      setEditingId(null);
      setDraft(initialDraft());
      setViewMode("view");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load promotion";
      setError(message);
    }
  };

  const closeModal = () => {
    setViewMode(null);
    setSelectedPromotion(null);
    setEditingId(null);
    setDraft(initialDraft());
    setResourceSearch("");
  };

  const submitPromotion = async () => {
    const name = draft.name.trim();
    const description = draft.description.trim();

    if (!name) {
      setError("Promotion name is required.");
      return;
    }

    if (!draft.startDate || !draft.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (new Date(draft.startDate) >= new Date(draft.endDate)) {
      setError("End date must be after start date.");
      return;
    }

    const applyIds =
      draft.scopeType === "PRODUCT"
        ? draft.productIds
        : draft.scopeType === "CATEGORY"
          ? draft.categoryIds
          : categories.map((item) => item.id);

    if (draft.scopeType === "ALL" && categories.length === 0) {
      setError("No categories available to attach a store-wide promotion.");
      return;
    }

    if (draft.scopeType !== "ALL" && applyIds.length === 0) {
      setError(
        draft.scopeType === "PRODUCT"
          ? "Select at least one product for this promotion."
          : "Select at least one category for this promotion.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("startDate", fromDateTimeLocal(draft.startDate));
      formData.append("endDate", fromDateTimeLocal(draft.endDate));
      if (draft.image) {
        formData.append("image", draft.image);
      }

      const saved = editingId
        ? await updatePromotion(editingId, formData)
        : await createPromotion(formData);

      const promotionId = saved.id || editingId;
      if (!promotionId) {
        throw new Error("Promotion was saved but no id was returned.");
      }

      if (draft.scopeType === "PRODUCT") {
        await applyPromotionToProducts(promotionId, applyIds);
      } else {
        await applyPromotionToCategories(promotionId, applyIds);
      }

      await loadPromotions();
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save promotion";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const submitToggleStatus = async (
    promotion: PromotionRecord,
    nextStatus: PromotionStatus,
  ) => {
    setSaving(true);
    setError(null);

    try {
      await togglePromotionStatus(promotion.id, nextStatus);
      await loadPromotions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const submitDeletePromotion = async () => {
    if (!confirmDelete) return;

    setSaving(true);
    setError(null);

    try {
      await deletePromotion(confirmDelete.id);
      setConfirmDelete(null);
      await loadPromotions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete promotion";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const selectedScopeInfo = useMemo(() => {
    if (!selectedPromotion) return null;
    return getPromotionScope(selectedPromotion, categories.length);
  }, [categories.length, selectedPromotion]);

  const filteredResourceItems = useMemo(
    () => filterResourceItems(draft, resourceSearch, categories, products),
    [draft, resourceSearch, categories, products],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / PAGE_SIZE));

  return {
    state: {
      loading,
      saving,
      promotions,
      stats,
      categories,
      products,
      searchInput,
      searchQuery,
      statusFilter,
      page,
      viewMode,
      selectedPromotion,
      editingId,
      draft,
      resourceSearch,
      error,
      confirmDelete,
      promotionDetails,
      filteredPromotions,
      pagedPromotions,
      selectedScopeInfo,
      filteredResourceItems,
      totalPages,
    },
    actions: {
      setSearchInput,
      setSearchQuery,
      setStatusFilter,
      setPage,
      setViewMode,
      setSelectedPromotion,
      setEditingId,
      setDraft,
      setResourceSearch,
      setError,
      setConfirmDelete,
      setPromotionDetails,
      loadResources,
      loadPromotions,
      openAddModal,
      openEditModal,
      openViewModal,
      closeModal,
      submitPromotion,
      submitToggleStatus,
      submitDeletePromotion,
    },
  };
}
