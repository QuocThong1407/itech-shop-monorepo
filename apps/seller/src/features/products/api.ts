import { apiJson } from "../../lib/seller-api";
import type {
  CategoriesResponse,
  ProductDetail,
  ProductRecord,
  ProductsResponse,
} from "./types";

export function fetchCategories() {
  return apiJson<CategoriesResponse>("/categories?page=1&limit=1000", undefined, "/seller");
}

export function fetchProducts(sellerUserId: string) {
  return apiJson<ProductsResponse>(
    `/products?page=1&limit=1000&sellerUserId=${encodeURIComponent(sellerUserId)}`,
    undefined,
    "/seller",
  );
}

export function fetchProductDetail(productId: string) {
  return apiJson<ProductDetail>(`/products/${productId}`, undefined, "/seller");
}

export function updateProduct(productId: string, payload: FormData) {
  return apiJson(`/products/${productId}`, { method: "PUT", body: payload }, "/seller");
}

export function updateProductStock(productId: string, stockQuantity: number) {
  return apiJson(
    `/products/${productId}/stock`,
    {
      method: "PATCH",
      body: JSON.stringify({ stockQuantity }),
    },
    "/seller",
  );
}

export function updateVariant(variantId: string, payload: FormData) {
  return apiJson(
    `/variants/${variantId}`,
    {
      method: "PUT",
      body: payload,
    },
    "/seller",
  );
}
