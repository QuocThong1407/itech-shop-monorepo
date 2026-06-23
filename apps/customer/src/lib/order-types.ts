// apps/customer/src/lib/order-types.ts
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

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
}

// ─── Pure helpers, không phụ thuộc cookies/server ───
export function getOrderTotal(order: Order): number {
  return order.Payment?.[0]?.amount ?? 0;
}

export function getOrderItemUnitPrice(item: OrderItem): number {
  const basePrice = item.ProductVariant.Product.price;
  const adjustment = item.ProductVariant.priceAdjustment || 0;
  return basePrice + adjustment;
}