export type CategoryOption = {
  id: string;
  name: string;
};

export type ProductSeller = {
  id: string;
  User?: {
    id: string;
    username?: string;
    email?: string;
  };
};

export type ProductVariantRecord = {
  id: string;
  quantity: number;
  variantAttributes: Record<string, string>;
  images?: string[] | null;
  priceAdjustment?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  images?: string[] | null;
  variantTypes?: string[] | null;
  variantOptions?: Record<string, string[]> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  categoryId: string;
  Category?: CategoryOption | null;
  Seller?: ProductSeller | null;
  averageRating?: number;
  reviewCount?: number;
  soldCount?: number;
  ProductVariant?: ProductVariantRecord[];
};

export type ProductsResponse = {
  products: ProductRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CategoriesResponse = {
  categories: CategoryOption[];
};

export type ProductDetail = ProductRecord & {
  ProductVariant?: ProductVariantRecord[];
};

export type FilterStatus = "ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_STOCK";

export type DraftState = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  images: File[];
  previews: string[];
};

export type VariantAttributeDraft = {
  id: string;
  key: string;
  value: string;
};

export type VariantDraftRow = {
  id: string;
  backendId: string;
  quantity: string;
  priceAdjustment: string;
  attributes: VariantAttributeDraft[];
  imageFile: File | null;
  imagePreview: string | null;
};

export type ProductStats = {
  total: number;
  active: number;
  lowStock: number;
  outStock: number;
};
