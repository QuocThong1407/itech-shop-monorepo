export type CategoryRecord = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListResponse = {
  categories: CategoryRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CategoryStatsResponse = {
  total: number;
  topCategories: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
  allCategories: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
};

export type ProductRecord = {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  images?: string[] | null;
  createdAt: string;
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

export type ModalMode = "view" | "edit" | "add" | null;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CategoryFormState = {
  name: string;
  description: string;
  image: File | null;
  preview: string;
};

export type RankedCategory = {
  id: string;
  name: string;
  productCount: number;
  rank: number;
};
