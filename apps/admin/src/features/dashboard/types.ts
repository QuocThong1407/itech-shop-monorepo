export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type UsersStats = {
  total: number;
  customers: number;
  sellers: number;
  admins: number;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductList = {
  products: Array<{
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
    images?: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: Pagination;
};

export type OrderList = {
  orders: Array<{
    id: string;
    orderDate: string;
    status: string;
    createdAt: string;
    Customer?: {
      User?: { id: string; username: string; email: string } | null;
    } | null;
    Payment?: Array<{
      amount: number;
      method: string;
      status: string;
    }> | null;
  }>;
  pagination: Pagination;
};

export type RevenueReport = {
  summary: {
    totalIncome: number;
    totalRefund: number;
    netRevenue: number;
  };
  rows: Array<{
    period: string;
    income: number;
    refund: number;
    netRevenue: number;
  }>;
  details: {
    totalCompletedPayments: number;
    totalApprovedReturns: number;
    totalApprovedCancellations: number;
  };
};

export type ActivityReport = {
  summary: {
    totalActiveUsers: number;
    newUsers: number;
    newOrders: number;
    newReviews: number;
    newUsersByRole: Record<string, number>;
  };
  statistics: {
    totalCustomers: number;
    totalSellers: number;
    totalAdmins: number;
  };
  eventSummary: {
    totalEvents: number;
    userEvents: number;
    orderEvents: number;
    returnEvents: number;
    cancellationEvents: number;
    productEvents: number;
    configEvents: number;
    reportEvents: number;
  };
  recentEvents: Array<{
    id: string;
    entityType: string;
    action: string;
    title: string;
    description: string;
    occurredAt: string;
    actorLabel: string;
    status?: string | null;
  }>;
};

export type TopMember = {
  rank: number;
  id: string;
  membership: string;
  spent: number;
  Customer?: {
    User?: {
      username: string;
      email: string;
    } | null;
  } | null;
};

export type CategoryStats = {
  total: number;
  topCategories: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
};

export type DashboardData = {
  usersStats: UsersStats;
  productList: ProductList;
  orderList: OrderList;
  revenueReport: RevenueReport;
  activityReport: ActivityReport;
  topMembers: TopMember[];
  categoryStats: CategoryStats;
};

export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "sky" | "amber" | "violet";
};

export type QuickNote = {
  title: string;
  value: string;
  note: string;
};
