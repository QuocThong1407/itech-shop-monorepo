export type PromotionStatus = "ACTIVE" | "UPCOMING" | "EXPIRED" | "INACTIVE";
export type ScopeType = "ALL" | "CATEGORY" | "PRODUCT";
export type ViewMode = "view" | "edit" | "add" | null;

export type PromotionRecord = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  startDate: string;
  endDate: string;
  status: PromotionStatus | string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
};

export type PromotionDetail = PromotionRecord & {
  appliedProducts?: Array<{
    id: string;
    name: string;
    images?: string[] | null;
  }>;
  appliedCategories?: Array<{
    id: string;
    name: string;
    image?: string | null;
  }>;
  Coupon?:
    | {
        id: string;
        code: string;
        discountPercentage: number;
        maxUsage: number;
        usageCount: number;
      }
    | Array<{
        id: string;
        code: string;
        discountPercentage: number;
        maxUsage: number;
        usageCount: number;
      }>
    | null;
  Admin?:
    | {
        id: string;
        User?: {
          id: string;
          username?: string | null;
          email?: string | null;
        } | null;
      }
    | null
    | Array<{
        id: string;
        User?: {
          id: string;
          username?: string | null;
          email?: string | null;
        } | null;
      }>;
};

export type PromotionListResponse = {
  promotions: PromotionRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PromotionStats = {
  total: number;
  active: number;
  upcoming: number;
  expired: number;
  inactive: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  image?: string | null;
  images?: string[] | null;
  description?: string | null;
};

export type DraftState = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  scopeType: ScopeType;
  categoryIds: string[];
  productIds: string[];
  image: File | null;
  preview: string;
};

export type PromotionScopeInfo = {
  type: ScopeType;
  label: string;
  products: Array<{
    id: string;
    name: string;
    images?: string[] | null;
  }>;
  categories: Array<{
    id: string;
    name: string;
    image?: string | null;
  }>;
};
