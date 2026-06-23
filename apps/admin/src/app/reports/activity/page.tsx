import { redirect } from "next/navigation";
import {
  buildReportExportHref,
  readReportJson,
  startDate,
} from "../../../lib/report-api";
import ActivityReportPageContent from "../../../features/reports/activity/activity-report-page-content";
import { parseActivityDate } from "../../../features/reports/activity/helpers";
import type { ActivityReport } from "../../../features/reports/activity/types";

export const dynamic = "force-dynamic";

type ActivityPageProps = {
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function ActivityReportPage({
  searchParams,
}: ActivityPageProps) {
  const params = (await searchParams) ?? {};
  const rangeStart = parseActivityDate(params.startDate, startDate(30));
  const rangeEnd = parseActivityDate(params.endDate, startDate(0));

  let report: ActivityReport;

  try {
    report = await readReportJson<ActivityReport>(
      `/reports/activity?startDate=${rangeStart}&endDate=${rangeEnd}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "UNAUTHORIZED") {
      redirect(`/login?next=${encodeURIComponent("/reports/activity")}`);
    }
    throw error;
  }

  const exportHref = buildReportExportHref("activity", {
    startDate: rangeStart,
    endDate: rangeEnd,
  });

  return (
    <ActivityReportPageContent
      report={report}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      exportHref={exportHref}
    />
  );
}
