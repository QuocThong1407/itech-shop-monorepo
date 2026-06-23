export type RevenueGroupBy = "day" | "month" | "year";

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

export type RevenueReportPageContentProps = {
  report: RevenueReport;
  rangeStart: string;
  rangeEnd: string;
  groupBy: RevenueGroupBy;
  exportHref: string;
};
