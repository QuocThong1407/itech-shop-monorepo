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
    <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-semibold text-[#008ECC]">Activity summary</p>
      <h3 className="mt-1 text-xl font-semibold text-slate-950">Backend report snapshot</h3>

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
            <span
              className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                item.tone === "sky"
                  ? "bg-sky-50 text-sky-700"
                  : item.tone === "emerald"
                    ? "bg-emerald-50 text-emerald-700"
                    : item.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-violet-50 text-violet-700"
              }`}
            >
              Live
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(0,142,204,0.12),_rgba(14,165,233,0.05))] p-5">
        <p className="text-sm font-semibold text-slate-900">User mix</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {Object.entries({
            customers: usersStats.customers,
            sellers: usersStats.sellers,
            admins: usersStats.admins,
          }).map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {Number(value).toLocaleString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
