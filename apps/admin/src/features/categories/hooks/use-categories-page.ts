"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchCategoryProducts,
  fetchCategoryStats,
  updateCategory,
} from "../api";
import { defaultPagination, emptyStats, initialFormState } from "../constants";
import { createTopCategoryMap } from "../helpers";
import type {
  CategoryFormState,
  CategoryRecord,
  ModalMode,
  ProductRecord,
} from "../types";

export function useCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [pagination, setPagination] = useState(defaultPagination);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRecord | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(initialFormState);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const topCategoryMap = useMemo(() => createTopCategoryMap(stats), [stats]);

  const loadCategories = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const [categoryData, statsData] = await Promise.all([
        fetchCategories({
          page,
          limit: defaultPagination.limit,
          query,
        }),
        fetchCategoryStats(),
      ]);

      setCategories(categoryData.categories ?? []);
      setPagination(categoryData.pagination ?? defaultPagination);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories(1);
  }, [query]);

  const openAdd = () => {
    setSelectedCategory(null);
    setFormState(initialFormState());
    setModalMode("add");
  };

  const openEdit = (category: CategoryRecord) => {
    setSelectedCategory(category);
    setFormState({
      name: category.name ?? "",
      description: category.description ?? "",
      image: null,
      preview: category.image ?? "",
    });
    setModalMode("edit");
  };

  const openView = async (category: CategoryRecord) => {
    setSelectedCategory(category);
    setModalMode("view");
    setProducts([]);
    setProductsLoading(true);
    setError(null);

    try {
      const response = await fetchCategoryProducts(category.id);
      setProducts(response.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category products.");
    } finally {
      setProductsLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCategory(null);
    setProducts([]);
    setProductsLoading(false);
    setSaving(false);
  };

  const submitCategory = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!formState.name.trim()) {
        throw new Error("Category name is required.");
      }

      const payload = new FormData();
      payload.append("name", formState.name.trim());
      payload.append("description", formState.description.trim());

      if (formState.image) {
        payload.append("image", formState.image);
      }

      if (modalMode === "add") {
        await createCategory(payload);
      }

      if (modalMode === "edit" && selectedCategory) {
        await updateCategory(selectedCategory.id, payload);
      }

      closeModal();
      await loadCategories(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const submitDeleteCategory = async () => {
    if (!confirmDeleteId) return;

    setSaving(true);
    setError(null);

    try {
      await deleteCategory(confirmDeleteId);
      await loadCategories(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setSaving(false);
      setConfirmDeleteId(null);
    }
  };

  return {
    state: {
      loading,
      saving,
      categories,
      stats,
      pagination,
      search,
      query,
      modalMode,
      selectedCategory,
      products,
      productsLoading,
      error,
      formState,
      confirmDeleteId,
      topCategoryMap,
    },
    actions: {
      setSearch,
      setQuery,
      setModalMode,
      setSelectedCategory,
      setProducts,
      setProductsLoading,
      setError,
      setFormState,
      setConfirmDeleteId,
      loadCategories,
      openAdd,
      openEdit,
      openView,
      closeModal,
      submitCategory,
      submitDeleteCategory,
    },
  };
}
