import { apiJson } from "../../lib/seller-api";
import type { OrdersResponse } from "../orders/types";
import type { ReturnsResponse } from "../returns/types";
import type { CancellationsResponse } from "../cancellations/types";
import type { ProductsResponse } from "../products/types";
import type { SellerDashboardData } from "./types";

export async function fetchSellerDashboardData(
  sellerUserId: string,
): Promise<SellerDashboardData> {
  const [orders, returns, cancellations, products] = await Promise.all([
    apiJson<OrdersResponse>("/orders?page=1&limit=200", undefined, "/seller"),
    apiJson<ReturnsResponse>("/returns?page=1&limit=200", undefined, "/seller"),
    apiJson<CancellationsResponse>(
      "/cancellations?page=1&limit=200",
      undefined,
      "/seller",
    ),
    apiJson<ProductsResponse>(
      `/products?page=1&limit=200&sellerUserId=${encodeURIComponent(sellerUserId)}`,
      undefined,
      "/seller",
    ),
  ]);

  return {
    orders: orders.orders || [],
    returns: returns.returns || [],
    cancellations: cancellations.cancellations || [],
    products: products.products || [],
  };
}
