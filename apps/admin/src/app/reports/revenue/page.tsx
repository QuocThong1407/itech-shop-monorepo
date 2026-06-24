import { redirect } from "next/navigation";
import {
  buildReportExportHref,
  readReportJson,
  startDate,
} from "../../../lib/report-api";
import RevenueReportPageContent from "../../../features/reports/revenue/revenue-report-page-content";
import {
  parseRevenueDate,
  parseRevenueGroupBy,
} from "../../../features/reports/revenue/helpers";
import type {
  RevenueGroupBy,
  RevenueReport,
} from "../../../features/reports/revenue/types";

export const dynamic = "force-dynamic";

type RevenuePageProps = {
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
    groupBy?: RevenueGroupBy;
  }>;
};

export default async function RevenueReportPage({
  searchParams,
}: RevenuePageProps) {
  const params = (await searchParams) ?? {};
  const rangeStart = parseRevenueDate(params.startDate, startDate(30));
  const rangeEnd = parseRevenueDate(params.endDate, startDate(0));
  const groupBy = parseRevenueGroupBy(params.groupBy);

  let report: RevenueReport;

  try {
    report = await readReportJson<RevenueReport>(
      `/reports/revenue?startDate=${rangeStart}&endDate=${rangeEnd}&groupBy=${groupBy}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "UNAUTHORIZED") {
      redirect(`/login?next=${encodeURIComponent("/reports/revenue")}`);
    }
    throw error;
  }

  const exportHref = buildReportExportHref("revenue", {
    startDate: rangeStart,
    endDate: rangeEnd,
    groupBy,
  });

  return (
    <RevenueReportPageContent
      report={report}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      groupBy={groupBy}
      exportHref={exportHref}
    />
  );
}
