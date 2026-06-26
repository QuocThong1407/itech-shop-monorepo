export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type CancellationStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";
export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface OrderCancellation {
  id: string;
  status: CancellationStatus;
}

export interface OrderReturn {
  id: string;
  status: ReturnStatus;
}

export interface OrderProductVariant {
  id: string;
  variantAttributes: Record<string, string> | null;
  priceAdjustment: number;
  images?: string[];
  Product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    images: string[];
  };
}

export interface OrderItem {
  id: string;
  quantity: number;
  ProductVariant: OrderProductVariant;
}

export interface OrderAddress {
  id: string;
  phoneNumber: string;
  address: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}

export interface OrderPayment {
  id: string;
  amount: number;
  method: "COD" | "VNPAY" | "STRIPE";
  status: "PENDING" | "SUCCESS" | "FAILED";
  paymentDate?: string;
  createdAt?: string;
}

export interface Order {
  id: string;
  orderDate: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  Address: OrderAddress;
  OrderItem: OrderItem[];
  Payment: OrderPayment[];
  // Thêm mới
  Cancellation?: OrderCancellation[];
  Return?: OrderReturn[];
}

export function getOrderTotal(order: Order): number {
  return order.Payment?.[0]?.amount ?? 0;
}

export function getOrderItemUnitPrice(item: OrderItem): number {
  const basePrice = item.ProductVariant.Product.price;
  const adjustment = item.ProductVariant.priceAdjustment || 0;
  return basePrice + adjustment;
}

// Helper lấy active cancellation/return (chưa bị reject/complete)
export function getActiveCancellation(order: Order): OrderCancellation | null {
  return (
    order.Cancellation?.find((c) =>
      ["REQUESTED", "APPROVED"].includes(c.status),
    ) ?? null
  );
}

export function getActiveReturn(order: Order): OrderReturn | null {
  return (
    order.Return?.find((r) => ["REQUESTED", "APPROVED"].includes(r.status)) ??
    null
  );
}