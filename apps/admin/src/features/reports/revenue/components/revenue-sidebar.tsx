import { formatReportDate } from "../../../../lib/report-api";
import type { RevenueReport } from "../types";

type RevenueSidebarProps = {
  report: RevenueReport;
  rangeStart: string;
  rangeEnd: string;
  groupBy: "day" | "month" | "year";
};

export default function RevenueSidebar({
  report,
  rangeStart,
  rangeEnd,
  groupBy,
}: RevenueSidebarProps) {
  return (
    <div className="flex min-w-0 w-full flex-col space-y-6">
      <article className="flex w-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold text-slate-900">Transaction breakdown</p>
        <div className="mt-4 space-y-3">
          <div className="w-full rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Completed payments
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {report.details.totalCompletedPayments.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="w-full rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Approved returns
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {report.details.totalApprovedReturns.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="w-full rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Approved cancellations
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {report.details.totalApprovedCancellations.toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      </article>

      <article className="flex w-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold text-slate-900">Report summary</p>
        <div className="mt-4 space-y-3">
          <div className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Grouped by <span className="font-semibold text-slate-900">{groupBy}</span>
          </div>
          <div className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Total periods{" "}
            <span className="font-semibold text-slate-900">
              {report.rows.length.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Date range{" "}
            <span className="font-semibold text-slate-900">
              {formatReportDate(rangeStart)} - {formatReportDate(rangeEnd)}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
