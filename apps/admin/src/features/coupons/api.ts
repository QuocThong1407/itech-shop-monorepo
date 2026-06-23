import { apiJson } from "../../lib/admin-api";
import type { CouponListResponse, PromotionsResponse } from "./types";

export function fetchPromotions() {
  return apiJson<PromotionsResponse>(
    "/promotions?page=1&limit=1000",
    undefined,
    "/coupons",
  );
}

export function fetchCoupons() {
  return apiJson<CouponListResponse>("/coupons?page=1&limit=1000", undefined, "/coupons");
}

export function createCoupon(payload: {
  code: string;
  promotionId: string;
  discountPercentage: number;
  maxUsage: number;
}) {
  return apiJson(
    "/coupons",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "/coupons",
  );
}

export function updateCoupon(
  couponId: string,
  payload: {
    code: string;
    promotionId: string;
    discountPercentage: number;
    maxUsage: number;
  },
) {
  return apiJson(
    `/coupons/${couponId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "/coupons",
  );
}

export function deleteCoupon(couponId: string) {
  return apiJson(
    `/coupons/${couponId}`,
    {
      method: "DELETE",
    },
    "/coupons",
  );
}
