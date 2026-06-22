"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bulkDeleteProducts,
  createProduct as createProductRequest,
  createVariant as createVariantRequest,
  deleteProduct as deleteProductRequest,
  deleteVariant as deleteVariantRequest,
  fetchProductDetail,
  fetchProductResources,
  fetchProducts as fetchProductsRequest,
  importProducts as importProductsRequest,
  updateProduct as updateProductRequest,
  updateVariant as updateVariantRequest,
} from "../api";
import { emptyStats, initialDraft, PAGE_SIZE } from "../constants";
import {
  buildVariantPayloads,
  createVariantAttribute,
  createVariantRow,
  getPreviewUrl,
  isBlankHtml,
  mapVariantRecordToDraft,
  normalizeStockStatus,
} from "../helpers";
import type {
  CategoryOption,
  DraftState,
  ModalMode,
  ProductDetail,
  ProductRecord,
  ProductStats,
  UserOption,
  VariantDraftRow,
} from "../types";

export function useProductsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sellers, setSellers] = useState<UserOption[]>([]);
  const [stats, setStats] = useState<ProductStats>(emptyStats);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_STOCK"
  >("ALL");
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(initialDraft());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductRecord | null>(
    null,
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importContinueOnError, setImportContinueOnError] = useState(true);
  const [importResult, setImportResult] = useState<any | null>(null);

  const loadResources = async () => {
    try {
      const resources = await fetchProductResources();
      setCategories(resources.categories);
      setSellers(resources.sellers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load resources.",
      );
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchProductsRequest(searchQuery);
      const list = response.products ?? [];
      setProducts(list);
      setSelectedProductIds((current) =>
        current.filter((id) => list.some((product) => product.id === id)),
      );

      const summary = { ...emptyStats, total: list.length };
      list.forEach((product) => {
        const status = normalizeStockStatus(product.stockQuantity);
        if (status === "ACTIVE") summary.active += 1;
        else if (status === "LOW_STOCK") summary.lowStock += 1;
        else summary.outStock += 1;
      });
      setStats(summary);
      setPage(1);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return;
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const status = normalizeStockStatus(product.stockQuantity);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && product.categoryId !== categoryFilter)
        return false;

      const query = searchInput.trim().toLowerCase();
      if (!query) return true;

      const haystack = [
        product.name,
        product.Category?.name,
        product.Seller?.User?.username,
        product.Seller?.User?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [categoryFilter, products, searchInput, statusFilter]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  const allPagedSelected =
    pagedProducts.length > 0 &&
    pagedProducts.every((product) => selectedProductIds.includes(product.id));

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    setSelectedProductIds((current) =>
      current.filter((id) =>
        filteredProducts.some((product) => product.id === id),
      ),
    );
  }, [filteredProducts]);

  const openAddModal = () => {
    setEditingId(null);
    setSelectedProduct(null);
    setDraft(initialDraft());
    setModalMode("add");
  };

  const openEditModal = async (product: ProductRecord | ProductDetail) => {
    setError(null);
    setEditingId(product.id);
    setModalMode("edit");

    try {
      const detail = await fetchProductDetail(product.id);
      setSelectedProduct(detail);
      setDraft({
        name: detail.name || "",
        description: detail.description || "",
        price: String(detail.price ?? ""),
        stockQuantity: String(detail.stockQuantity ?? ""),
        categoryId: detail.categoryId || "",
        sellerUserId: detail.Seller?.User?.id || "",
        useVariants: Boolean(detail.ProductVariant?.length),
        variants: detail.ProductVariant?.length
          ? detail.ProductVariant.map((variant) =>
              mapVariantRecordToDraft(variant),
            )
          : [],
        existingImages: detail.images ?? [],
        newImages: [],
        previews: detail.images ?? [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load product detail.",
      );
    }
  };

  const openViewModal = async (product: ProductRecord) => {
    setError(null);
    try {
      const detail = await fetchProductDetail(product.id);
      setSelectedProduct(detail);
      setEditingId(null);
      setModalMode("view");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load product detail.",
      );
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
    setEditingId(null);
    setDraft(initialDraft());
  };

  const closeImportModal = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportContinueOnError(true);
    setImportResult(null);
  };

  const submitImport = async () => {
    if (!importFile) {
      setError("Please choose a CSV or XLSX file to import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("continueOnError", String(importContinueOnError));

    setImporting(true);
    setError(null);

    try {
      const result = await importProductsRequest(formData);
      setImportResult(result);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file.");
    } finally {
      setImporting(false);
    }
  };

  const syncVariantRows = async (
    productId: string,
    rows: VariantDraftRow[],
  ) => {
    if (!selectedProduct) return;

    const existingRows = selectedProduct.ProductVariant ?? [];
    const touchedIds = new Set<string>();
    const normalizedRows = buildVariantPayloads(rows);

    for (const payload of normalizedRows) {
      const formData = new FormData();
      formData.append("quantity", String(payload.quantity));
      formData.append("priceAdjustment", String(payload.priceAdjustment));
      formData.append(
        "variantAttributes",
        JSON.stringify(payload.variantAttributes),
      );

      if (payload.imageFile) {
        formData.append("images", payload.imageFile);
      }

      if (payload.backendId) {
        touchedIds.add(payload.backendId);
        await updateVariantRequest(payload.backendId, formData);
      } else {
        formData.append("productId", productId);
        await createVariantRequest(formData);
      }
    }

    for (const row of existingRows) {
      if (!touchedIds.has(row.id)) {
        await deleteVariantRequest(row.id);
      }
    }
  };

  const submitProduct = async () => {
    const name = draft.name.trim();
    const description = draft.description.trim();
    const categoryId = draft.categoryId;
    const sellerUserId = draft.sellerUserId;
    const price = Number(draft.price);
    const stockQuantity = Number(draft.stockQuantity);

    if (!name) return void setError("Product name is required.");
    if (!description || isBlankHtml(description)) {
      return void setError("Product description is required.");
    }
    if (!categoryId) return void setError("Please select a category.");
    if (!editingId && !sellerUserId) {
      return void setError("Please select a seller.");
    }
    if (!Number.isFinite(price) || price < 0) {
      return void setError("Price must be a valid positive number.");
    }
    if (
      !draft.useVariants &&
      (!Number.isFinite(stockQuantity) || stockQuantity < 0)
    ) {
      return void setError("Stock quantity must be a valid positive number.");
    }

    let parsedVariants = [] as ReturnType<typeof buildVariantPayloads>;
    if (draft.useVariants) {
      try {
        parsedVariants = buildVariantPayloads(draft.variants);
      } catch (parseError) {
        setError(
          parseError instanceof Error
            ? parseError.message
            : "Invalid variants payload.",
        );
        return;
      }
      if (parsedVariants.length === 0) {
        return void setError("Add at least one variant or turn variants off.");
      }
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", String(price));
      formData.append("categoryId", categoryId);

      if (!editingId) formData.append("sellerUserId", sellerUserId);
      if (!draft.useVariants) {
        formData.append("stockQuantity", String(stockQuantity));
      }

      if (draft.useVariants && !editingId) {
        formData.append(
          "variants",
          JSON.stringify(
            parsedVariants.map((variant) => ({
              variantAttributes: variant.variantAttributes,
              quantity: variant.quantity,
              priceAdjustment: variant.priceAdjustment,
            })),
          ),
        );

        parsedVariants.forEach((variant, index) => {
          if (variant.imageFile) {
            formData.append(`variant_image_${index}`, variant.imageFile);
          }
        });
      }

      draft.newImages.forEach((file) => {
        formData.append("images", file);
      });

      if (editingId) {
        await updateProductRequest(editingId, formData);
      } else {
        await createProductRequest(formData);
      }

      if (editingId && draft.useVariants) {
        await syncVariantRows(editingId, draft.variants);
      } else if (
        editingId &&
        !draft.useVariants &&
        selectedProduct?.ProductVariant?.length
      ) {
        await Promise.all(
          (selectedProduct.ProductVariant ?? []).map((variant) =>
            deleteVariantRequest(variant.id),
          ),
        );
      }

      await loadProducts();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    setError(null);

    try {
      await deleteProductRequest(confirmDelete.id);
      setConfirmDelete(null);
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const toggleSelectAllPaged = () => {
    if (allPagedSelected) {
      setSelectedProductIds((current) =>
        current.filter(
          (id) => !pagedProducts.some((product) => product.id === id),
        ),
      );
      return;
    }

    setSelectedProductIds((current) => {
      const next = new Set(current);
      pagedProducts.forEach((product) => next.add(product.id));
      return Array.from(next);
    });
  };

  const submitBulkDelete = async () => {
    if (selectedProductIds.length === 0) {
      return void setError("Please select at least one product to delete.");
    }

    setSaving(true);
    setError(null);

    try {
      const result = await bulkDeleteProducts(selectedProductIds);
      setSelectedProductIds([]);
      setBulkDeleteOpen(false);
      await loadProducts();

      if (result.failureCount > 0) {
        setError(
          `${result.deletedCount} products deleted, ${result.failureCount} failed.`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete products.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedStatus = useMemo(() => {
    if (!selectedProduct) return "OUT_STOCK" as const;
    return normalizeStockStatus(selectedProduct.stockQuantity) as
      | "ACTIVE"
      | "LOW_STOCK"
      | "OUT_STOCK";
  }, [selectedProduct]);

  const openImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    setDraft((current) => ({
      ...current,
      newImages: [...current.newImages, ...incoming],
      previews: [
        ...current.previews,
        ...incoming.map((file) => getPreviewUrl(file)),
      ],
    }));
  };

  const removePreview = (index: number) => {
    setDraft((current) => {
      const nextNewImages = [...current.newImages];
      const nextPreviews = [...current.previews];
      nextNewImages.splice(index, 1);
      nextPreviews.splice(index, 1);
      return {
        ...current,
        newImages: nextNewImages,
        previews: nextPreviews,
      };
    });
  };

  const addVariantRow = () => {
    setDraft((current) => ({
      ...current,
      useVariants: true,
      variants: [...current.variants, createVariantRow()],
    }));
  };

  const updateVariantRow = (
    rowId: string,
    updater: (row: VariantDraftRow) => VariantDraftRow,
  ) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((row) =>
        row.id === rowId ? updater(row) : row,
      ),
    }));
  };

  const removeVariantRow = (rowId: string) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.filter((row) => row.id !== rowId),
    }));
  };

  const addVariantAttribute = (rowId: string) => {
    updateVariantRow(rowId, (row) => ({
      ...row,
      attributes: [...row.attributes, createVariantAttribute()],
    }));
  };

  const updateVariantAttribute = (
    rowId: string,
    attributeId: string,
    field: "key" | "value",
    value: string,
  ) => {
    updateVariantRow(rowId, (row) => ({
      ...row,
      attributes: row.attributes.map((attribute) =>
        attribute.id === attributeId
          ? { ...attribute, [field]: value }
          : attribute,
      ),
    }));
  };

  const removeVariantAttribute = (rowId: string, attributeId: string) => {
    updateVariantRow(rowId, (row) => {
      const next = row.attributes.filter(
        (attribute) => attribute.id !== attributeId,
      );
      return {
        ...row,
        attributes: next.length > 0 ? next : [createVariantAttribute()],
      };
    });
  };

  const setVariantImage = (rowId: string, file: File | null) => {
    updateVariantRow(rowId, (row) => ({
      ...row,
      imageFile: file,
      imagePreview: file ? getPreviewUrl(file) : null,
    }));
  };

  return {
    state: {
      loading,
      saving,
      importing,
      products,
      categories,
      sellers,
      stats,
      searchInput,
      searchQuery,
      categoryFilter,
      statusFilter,
      page,
      modalMode,
      selectedProduct,
      editingId,
      draft,
      error,
      confirmDelete,
      selectedProductIds,
      bulkDeleteOpen,
      importOpen,
      importFile,
      importContinueOnError,
      importResult,
      filteredProducts,
      pagedProducts,
      totalPages,
      allPagedSelected,
      selectedStatus,
    },
    actions: {
      setSearchInput,
      setSearchQuery,
      setCategoryFilter,
      setStatusFilter,
      setPage,
      setDraft,
      setError,
      setConfirmDelete,
      setSelectedProductIds,
      setBulkDeleteOpen,
      setImportOpen,
      setImportFile,
      setImportContinueOnError,
      setImportResult,
      loadProducts,
      openAddModal,
      openEditModal,
      openViewModal,
      closeModal,
      closeImportModal,
      submitImport,
      submitProduct,
      deleteProduct,
      toggleProductSelection,
      toggleSelectAllPaged,
      submitBulkDelete,
      openImages,
      removePreview,
      addVariantRow,
      updateVariantRow,
      removeVariantRow,
      addVariantAttribute,
      updateVariantAttribute,
      removeVariantAttribute,
      setVariantImage,
    },
  };
}
