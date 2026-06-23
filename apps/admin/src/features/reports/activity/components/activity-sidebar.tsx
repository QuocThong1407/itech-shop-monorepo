import { formatReportDate } from "../../../../lib/report-api";
import EventVolumeChart from "./event-volume-chart";
import type { ActivityReport } from "../types";

type ActivitySidebarProps = {
  report: ActivityReport;
  rangeStart: string;
  rangeEnd: string;
};

export default function ActivitySidebar({
  report,
  rangeStart,
  rangeEnd,
}: ActivitySidebarProps) {
  const roleCounts = report.summary.newUsersByRole;
  const roleTotal = Object.values(roleCounts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-6">
      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold text-slate-900">Role distribution</p>
        <div className="mt-5 space-y-4">
          {(["CUSTOMER", "SELLER", "ADMIN"] as const).map((role) => {
            const value = roleCounts[role] || 0;
            const width = Math.max((value / Math.max(roleTotal, 1)) * 100, 8);
            const tone =
              role === "CUSTOMER"
                ? "bg-[#008ECC]"
                : role === "SELLER"
                  ? "bg-emerald-500"
                  : "bg-slate-900";

            return (
              <div key={role} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">{role.toLowerCase()}</span>
                  <span className="font-semibold text-slate-950">
                    {value.toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className={`h-3 rounded-full ${tone}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold text-slate-900">Activity breakdown</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Reporting window{" "}
            <span className="font-semibold text-slate-900">
              {formatReportDate(rangeStart)} - {formatReportDate(rangeEnd)}
            </span>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            New orders{" "}
            <span className="font-semibold text-slate-900">
              {report.summary.newOrders.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            New reviews{" "}
            <span className="font-semibold text-slate-900">
              {report.summary.newReviews.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Logged events{" "}
            <span className="font-semibold text-slate-900">
              {report.eventSummary.totalEvents.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </article>

      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold text-slate-900">Recent event volume</p>
        <p className="mt-1 text-sm text-slate-500">
          Event count distribution based on the current activity log window.
        </p>
        <div className="mt-4">
          <EventVolumeChart recentEvents={report.recentEvents} />
        </div>
      </article>
    </div>
  );
}
