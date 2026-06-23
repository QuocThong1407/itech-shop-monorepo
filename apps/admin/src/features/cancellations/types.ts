export type CancellationOrderItem = {
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

export type CancellationRecord = {
  id: string;
  reason?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  Order?: {
    id: string;
    orderDate?: string;
    status?: string;
    Customer?: {
      User?: {
        username?: string;
        email?: string;
        image?: string;
      };
    };
    OrderItem?: CancellationOrderItem[];
    Payment?: Array<{
      amount?: number;
      method?: string;
      status?: string;
      paymentDate?: string;
    }>;
  };
};

export type CancellationsResponse = {
  cancellations: CancellationRecord[];
};

export type CancellationStats = {
  total: number;
  requested: number;
  approved: number;
  completed: number;
  rejected: number;
};

export type CancellationCustomerUser = NonNullable<
  NonNullable<NonNullable<CancellationRecord["Order"]>["Customer"]>["User"]
>;

export type CancellationPayment = NonNullable<
  NonNullable<NonNullable<CancellationRecord["Order"]>["Payment"]>[number]
>;
