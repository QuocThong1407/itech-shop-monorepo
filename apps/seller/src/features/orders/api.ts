import { apiJson } from "../../lib/seller-api";
import type { OrderRecord, OrdersResponse } from "./types";

export function fetchOrders() {
  return apiJson<OrdersResponse>("/orders?page=1&limit=2000");
}

export function fetchOrderDetail(orderId: string) {
  return apiJson<OrderRecord>(`/orders/${orderId}`);
}

export function updateOrderStatus(orderId: string, status: string) {
  return apiJson(
    `/orders/${orderId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    "/seller/orders",
  );
}
