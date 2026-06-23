import { KeyValueGrid, PanelHeader, StatusBadge, SurfaceCard } from "@itech/shared";
import type { ActivityReport, UsersStats } from "../types";

type ActivitySummaryPanelProps = {
  activityReport: ActivityReport;
  usersStats: UsersStats;
};

export default function ActivitySummaryPanel({
  activityReport,
  usersStats,
}: ActivitySummaryPanelProps) {
  return (
    <SurfaceCard className="flex h-full flex-col rounded-[2rem] bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <PanelHeader title="Backend report snapshot" eyebrow="Activity summary" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          {
            label: "Active users",
            value: activityReport.summary.totalActiveUsers,
            tone: "sky",
          },
          {
            label: "New users",
            value: activityReport.summary.newUsers,
            tone: "emerald",
          },
          {
            label: "New orders",
            value: activityReport.summary.newOrders,
            tone: "amber",
          },
          {
            label: "New reviews",
            value: activityReport.summary.newReviews,
            tone: "violet",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {Number(item.value).toLocaleString("vi-VN")}
            </p>
            <StatusBadge
              tone={
                item.tone === "emerald"
                  ? "success"
                  : item.tone === "amber"
                    ? "warning"
                    : "neutral"
              }
              className={`mt-3 ${
                item.tone === "sky"
                  ? "bg-sky-50 text-sky-700 ring-sky-200"
                  : item.tone === "violet"
                    ? "bg-violet-50 text-violet-700 ring-violet-200"
                    : ""
              }`}
            >
              Live
            </StatusBadge>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(0,142,204,0.12),_rgba(14,165,233,0.05))] p-5">
        <p className="text-sm font-semibold text-slate-900">User mix</p>
        <KeyValueGrid
          className="mt-4"
          columnsClassName="grid grid-cols-3 gap-3"
          itemClassName="text-center shadow-sm"
          items={Object.entries({
            customers: usersStats.customers,
            sellers: usersStats.sellers,
            admins: usersStats.admins,
          }).map(([label, value]) => ({
            label,
            value: (
              <span className="text-2xl font-semibold text-slate-950">
                {Number(value).toLocaleString("vi-VN")}
              </span>
            ),
          }))}
        />
      </div>
    </SurfaceCard>
  );
}
