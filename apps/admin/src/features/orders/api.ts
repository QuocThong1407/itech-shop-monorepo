import { apiJson } from "../../lib/admin-api";
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
    "/orders",
  );
}

export function deleteOrder(orderId: string) {
  return apiJson(
    `/orders/${orderId}`,
    {
      method: "DELETE",
    },
    "/orders",
  );
}
