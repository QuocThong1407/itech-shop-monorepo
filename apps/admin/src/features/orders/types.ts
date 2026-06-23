export type OrderItem = {
  id: string;
  quantity: number;
  ProductVariant?: {
    id: string;
    variantAttributes?: Record<string, string>;
    priceAdjustment?: number;
    Product?: {
      id: string;
      name?: string;
      price?: number;
      images?: string[];
    };
  };
};

export type OrderRecord = {
  id: string;
  orderDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  Customer?: {
    id: string;
    User?: {
      id: string;
      username?: string;
      email?: string;
      image?: string;
    } | null;
  } | null;
  Address?: {
    id: string;
    phoneNumber?: string;
    address?: string;
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
  } | null;
  OrderItem?: OrderItem[];
  Payment?: Array<{
    id: string;
    amount?: number;
    method?: string;
    status?: string;
    paymentDate?: string;
  }> | null;
};

export type OrderCustomerUser = NonNullable<
  NonNullable<OrderRecord["Customer"]>["User"]
>;

export type OrderPayment = NonNullable<NonNullable<OrderRecord["Payment"]>[number]>;

export type OrdersResponse = {
  orders: OrderRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type OrderStats = {
  total: number;
  pending: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};
