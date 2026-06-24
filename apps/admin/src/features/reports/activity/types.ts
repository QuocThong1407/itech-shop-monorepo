export type ActivityRowBase = {
  userId: string;
  username: string;
  email: string;
  lastActive: string;
};

export type ActivityReport = {
  summary: {
    totalActiveUsers: number;
    newUsers: number;
    newOrders: number;
    newReviews: number;
    newUsersByRole: Record<string, number>;
  };
  activities: {
    customers: Array<ActivityRowBase & { totalOrders?: number }>;
    sellers: Array<ActivityRowBase & { totalProducts?: number }>;
    admins: Array<ActivityRowBase & { totalReportsGenerated?: number }>;
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

export type ActivityReportPageContentProps = {
  report: ActivityReport;
  rangeStart: string;
  rangeEnd: string;
  exportHref: string;
};
