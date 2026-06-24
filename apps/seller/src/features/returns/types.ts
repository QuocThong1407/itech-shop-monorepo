export type ReturnOrderItem = {
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

export type ReturnRecord = {
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
    OrderItem?: ReturnOrderItem[];
    Payment?: Array<{
      amount?: number;
      method?: string;
      status?: string;
      paymentDate?: string;
    }>;
  };
};

export type ReturnsResponse = {
  returns: ReturnRecord[];
};

export type ReturnStats = {
  total: number;
  requested: number;
  approved: number;
  completed: number;
  rejected: number;
};

export type ReturnCustomerUser = NonNullable<
  NonNullable<NonNullable<ReturnRecord["Order"]>["Customer"]>["User"]
>;

export type ReturnPayment = NonNullable<
  NonNullable<NonNullable<ReturnRecord["Order"]>["Payment"]>[number]
>;
