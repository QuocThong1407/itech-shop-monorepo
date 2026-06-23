export type PromotionStatus = "ACTIVE" | "UPCOMING" | "EXPIRED" | "INACTIVE";

export type PromotionOption = {
  id: string;
  name: string;
  status: PromotionStatus | string;
  startDate: string;
  endDate: string;
  description?: string | null;
};

export type CouponRecord = {
  id: string;
  code: string;
  discountPercentage: number;
  maxUsage: number;
  usageCount: number;
  promotionId: string;
  Promotion?: PromotionOption | null;
};

export type CouponListResponse = {
  coupons: CouponRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PromotionsResponse = {
  promotions: PromotionOption[];
};

export type CouponDraft = {
  code: string;
  promotionId: string;
  discountPercentage: string;
  maxUsage: string;
};

export type ViewMode = "view" | "edit" | "add" | null;

export type CouponStats = {
  total: number;
  active: number;
  upcoming: number;
  expired: number;
  inactive: number;
};
