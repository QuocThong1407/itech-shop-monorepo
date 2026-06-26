"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyDraft, PAGE_SIZE } from "../constants";
import {
  fetchCategories,
  fetchProductDetail,
  fetchProducts,
  updateProduct,
  updateProductStock,
  updateVariant,
} from "../api";
import {
  buildVariantAttributesObject,
  buildProductStats,
  createDraftFromProduct,
  createVariantAttribute,
  filterProducts,
  getImagePreviews,
  isBlankHtml,
  mapProductVariantsToDraft,
  paginateProducts,
  parseAuthUserId,
} from "../helpers";
import type {
  CategoryOption,
  DraftState,
  FilterStatus,
  ProductDetail,
  ProductRecord,
  VariantDraftRow,
} from "../types";

export function useProductsPage() {
  const [sellerUserId, setSellerUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraftRow[]>([]);

  useEffect(() => {
    setSellerUserId(parseAuthUserId());
  }, []);

  const loadCategories = async () => {
    try {
      const result = await fetchCategories();
      setCategories(result.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    }
  };

  const loadProducts = async () => {
    if (!sellerUserId) return;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchProducts(sellerUserId);
      setProducts(result.products || []);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!sellerUserId) return;
    void loadProducts();
  }, [sellerUserId]);

  const filteredProducts = useMemo(
    () => filterProducts(products, categoryFilter, statusFilter, searchText),
    [products, categoryFilter, statusFilter, searchText],
  );

  const pagedProducts = useMemo(
    () => paginateProducts(filteredProducts, page, PAGE_SIZE),
    [filteredProducts, page],
  );

  const stats = useMemo(() => buildProductStats(products), [products]);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, statusFilter, searchText]);

  const openView = async (product: ProductRecord) => {
    setError(null);
    try {
      const detail = await fetchProductDetail(product.id);
      setSelectedProduct(detail);
      setDetailOpen(true);
    } catch {
      setSelectedProduct(product);
      setDetailOpen(true);
    }
  };

  const openEdit = async (product: ProductRecord) => {
    setError(null);
    try {
      const detail = await fetchProductDetail(product.id);
      setSelectedProduct(detail);
      setDraft(createDraftFromProduct(detail));
      setVariantDrafts(mapProductVariantsToDraft(detail.ProductVariant));
      setEditOpen(true);
    } catch {
      setSelectedProduct(product);
      setDraft(createDraftFromProduct(product));
      setVariantDrafts(mapProductVariantsToDraft(product.ProductVariant));
      setEditOpen(true);
    }
  };

  const handlePreviewImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files);
    setDraft((prev) => ({
      ...prev,
      images: selected,
      previews: getImagePreviews(selected),
    }));
  };

  const saveProduct = async () => {
    if (!selectedProduct) return;

    const name = draft.name.trim();
    const description = draft.description.trim();
    const price = Number(draft.price);
    const hasVariants = Boolean(selectedProduct.ProductVariant?.length);
    const stockQuantity = Number(draft.stockQuantity);

    if (!name) return setError("Product name is required.");
    if (!description || isBlankHtml(description)) {
      return setError("Product description is required.");
    }
    if (!Number.isFinite(price) || price < 0) {
      return setError("Price must be a valid positive number.");
    }
    if (!draft.categoryId) {
      return setError("Please select a category.");
    }
    if (!hasVariants && (!Number.isFinite(stockQuantity) || stockQuantity < 0)) {
      return setError("Stock quantity must be a valid positive number.");
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", String(price));
      formData.append("categoryId", draft.categoryId);

      if (!hasVariants) {
        formData.append("stockQuantity", String(stockQuantity));
      }

      draft.images.forEach((file) => {
        formData.append("images", file);
      });

      await updateProduct(selectedProduct.id, formData);

      if (!hasVariants) {
        await updateProductStock(selectedProduct.id, stockQuantity);
      }

      if (hasVariants && variantDrafts.length > 0) {
        await Promise.all(variantDrafts.map(async (variant) => {
          const variantFormData = new FormData();
          variantFormData.append("quantity", String(Number(variant.quantity || 0)));
          variantFormData.append(
            "priceAdjustment",
            String(Number(variant.priceAdjustment || 0)),
          );
          variantFormData.append(
            "variantAttributes",
            JSON.stringify(buildVariantAttributesObject(variant.attributes)),
          );

          if (variant.imageFile) {
            variantFormData.append("images", variant.imageFile);
          }

          await updateVariant(variant.backendId, variantFormData);
        }));
      }

      await loadProducts();
      setEditOpen(false);
      setDetailOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  const updateVariantRow = (
    rowId: string,
    updater: (row: VariantDraftRow) => VariantDraftRow,
  ) => {
    setVariantDrafts((current) =>
      current.map((row) => (row.backendId === rowId ? updater(row) : row)),
    );
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
        attribute.id === attributeId ? { ...attribute, [field]: value } : attribute,
      ),
    }));
  };

  const removeVariantAttribute = (rowId: string, attributeId: string) => {
    updateVariantRow(rowId, (row) => {
      const next = row.attributes.filter((attribute) => attribute.id !== attributeId);
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
      imagePreview: file ? URL.createObjectURL(file) : null,
    }));
  };

  const resetVariantImage = (rowId: string) => {
    updateVariantRow(rowId, (row) => ({
      ...row,
      imageFile: null,
      imagePreview:
        selectedProduct?.ProductVariant?.find((variant) => variant.id === rowId)?.images?.[0] ?? null,
    }));
  };

  return {
    state: {
      sellerUserId,
      loading,
      saving,
      products,
      categories,
      searchText,
      categoryFilter,
      statusFilter,
      page,
      selectedProduct,
      detailOpen,
      editOpen,
      error,
      draft,
      variantDrafts,
      filteredProducts,
      pagedProducts,
      stats,
      totalPages,
    },
    actions: {
      setSearchText,
      setCategoryFilter,
      setStatusFilter,
      setPage,
      setSelectedProduct,
      setDetailOpen,
      setEditOpen,
      setError,
      setDraft,
      setVariantDrafts,
      loadProducts,
      openView,
      openEdit,
      handlePreviewImages,
      saveProduct,
      updateVariantRow,
      addVariantAttribute,
      updateVariantAttribute,
      removeVariantAttribute,
      setVariantImage,
      resetVariantImage,
    },
  };
}
