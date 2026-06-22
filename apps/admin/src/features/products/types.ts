export type UserOption = {
  id: string;
  username: string;
  email: string;
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type VariantAttributeDraft = {
  id: string;
  key: string;
  value: string;
};

export type VariantDraftRow = {
  id: string;
  backendId: string | null;
  attributes: VariantAttributeDraft[];
  quantity: string;
  priceAdjustment: string;
  imageFile: File | null;
  imagePreview: string | null;
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

export type ProductSeller = {
  id: string;
  email?: string;
  image?: string | null;
  User?: {
    id: string;
    username: string;
    email: string;
  };
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CategoriesResponse = {
  categories: CategoryOption[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SellersResponse = {
  users: UserOption[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductStats = {
  total: number;
  active: number;
  lowStock: number;
  outStock: number;
};

export type ProductDetail = ProductRecord & {
  ProductVariant?: ProductVariantRecord[];
};

export type ProductImportResultRow = {
  index: number;
  success: boolean;
  productId?: string;
  name?: string | null;
  error?: string;
};

export type ProductImportResult = {
  total: number;
  processed: number;
  successCount: number;
  failureCount: number;
  results: ProductImportResultRow[];
};

export type ProductBulkDeleteResult = {
  total: number;
  deletedCount: number;
  failureCount: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
};

export type ModalMode = "view" | "edit" | "add" | null;

export type DraftState = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  sellerUserId: string;
  useVariants: boolean;
  variants: VariantDraftRow[];
  existingImages: string[];
  newImages: File[];
  previews: string[];
};

export type BuiltVariantPayload = {
  variantAttributes: Record<string, string>;
  quantity: number;
  priceAdjustment: number;
  imageFile: File | null;
  backendId: string | null;
};
