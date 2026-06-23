import { redirect } from "next/navigation";
import {
  buildReportExportHref,
  formatReportDate,
  readReportJson,
  startDate,
} from "../../../lib/report-api";
import ActivityTabs from "./activity-tabs";

export const dynamic = "force-dynamic";

type ActivityReport = {
  summary: {
    totalActiveUsers: number;
    newUsers: number;
    newOrders: number;
    newReviews: number;
    newUsersByRole: Record<string, number>;
  };
  activities: {
    customers: Array<{
      userId: string;
      username: string;
      email: string;
      lastActive: string;
      accountCreated: string;
      totalOrders?: number;
    }>;
    sellers: Array<{
      userId: string;
      username: string;
      email: string;
      lastActive: string;
      accountCreated: string;
      totalProducts?: number;
    }>;
    admins: Array<{
      userId: string;
      username: string;
      email: string;
      lastActive: string;
      accountCreated: string;
      totalReportsGenerated?: number;
    }>;
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

type ActivityPageProps = {
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
};

function parseDate(value: string | string[] | undefined, fallback: string) {
  if (typeof value === "string" && value) return value;
  return fallback;
}

function MetricCard({
  title,
  value,
  accent,
  note,
}: {
  title: string;
  value: string;
  accent: string;
  note: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{note}</p>
        </div>
        <div className={`mt-1 h-3 w-3 rounded-full ${accent}`} />
      </div>
    </article>
  );
}

function eventTone(entityType: string) {
  switch (entityType) {
    case "order":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "return":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "cancellation":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "product":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "config":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "report":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
  }
}

function SummaryBars({
  report,
}: {
  report: ActivityReport;
}) {
  const items = [
    { label: "Active users", value: report.summary.totalActiveUsers, color: "#008ECC" },
    { label: "New users", value: report.summary.newUsers, color: "#10b981" },
    { label: "New orders", value: report.summary.newOrders, color: "#f59e0b" },
    { label: "New reviews", value: report.summary.newReviews, color: "#8b5cf6" },
  ];
  const width = 560;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 54, left: 20 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const slotWidth = innerWidth / items.length;
  const barWidth = Math.max(slotWidth * 0.42, 28);
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[18rem] w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const y = padding.top + innerHeight - innerHeight * step;
          return (
            <line
              key={step}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 6"
            />
          );
        })}

        {items.map((item, index) => {
          const valueHeight = (item.value / maxValue) * innerHeight;
          const x = padding.left + slotWidth * index + slotWidth / 2 - barWidth / 2;
          const y = padding.top + innerHeight - valueHeight;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={barWidth} height={valueHeight} rx="14" fill={item.color} />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fill="#0f172a">
                {item.value.toLocaleString("vi-VN")}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 20}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function EventVolumeChart({
  recentEvents,
}: {
  recentEvents: ActivityReport["recentEvents"];
}) {
  const buckets = new Map<string, number>();
  recentEvents.forEach((event) => {
    const key = event.occurredAt.slice(0, 10);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });

  const items = Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map(([date, count]) => ({
      label: formatReportDate(date),
      count,
    }));

  if (items.length === 0) {
    return (
      <div className="grid h-[16rem] place-items-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No event volume data available.
      </div>
    );
  }

  const width = 420;
  const height = 220;
  const padding = { top: 18, right: 14, bottom: 42, left: 14 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const slotWidth = innerWidth / items.length;
  const barWidth = Math.max(slotWidth * 0.5, 18);
  const maxValue = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[16rem] w-full">
        {items.map((item, index) => {
          const valueHeight = (item.count / maxValue) * innerHeight;
          const x = padding.left + slotWidth * index + slotWidth / 2 - barWidth / 2;
          const y = padding.top + innerHeight - valueHeight;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={barWidth} height={valueHeight} rx="12" fill="#0f172a" />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="10" fill="#0f172a">
                {item.count}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 14}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default async function ActivityReportPage({
  searchParams,
}: ActivityPageProps) {
  const params = (await searchParams) ?? {};
  const rangeStart = parseDate(params.startDate, startDate(30));
  const rangeEnd = parseDate(params.endDate, startDate(0));

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

  const roleCounts = report.summary.newUsersByRole;
  const roleTotal = Object.values(roleCounts).reduce((sum, value) => sum + value, 0);
  const exportHref = buildReportExportHref("activity", {
    startDate: rangeStart,
    endDate: rangeEnd,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Activity insights
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Activity Report
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review active users, new users, orders, reviews, and role
              distribution for the selected period.
            </p>
          </div>

          <form
            method="get"
            className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:min-w-[28rem]"
          >
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Start date
              </span>
              <input
                type="date"
                name="startDate"
                defaultValue={rangeStart}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                End date
              </span>
              <input
                type="date"
                name="endDate"
                defaultValue={rangeEnd}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
              >
                Apply filters
              </button>
              <a
                href={exportHref}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Export Excel
              </a>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active users"
          value={report.summary.totalActiveUsers.toLocaleString("vi-VN")}
          note="Accounts updated in range"
          accent="bg-[#008ECC]"
        />
        <MetricCard
          title="New users"
          value={report.summary.newUsers.toLocaleString("vi-VN")}
          note="Joined within the period"
          accent="bg-emerald-500"
        />
        <MetricCard
          title="New orders"
          value={report.summary.newOrders.toLocaleString("vi-VN")}
          note="Fresh order records"
          accent="bg-amber-500"
        />
        <MetricCard
          title="New reviews"
          value={report.summary.newReviews.toLocaleString("vi-VN")}
          note="Recent customer feedback"
          accent="bg-violet-500"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6 xl:flex xl:flex-col xl:space-y-0">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] xl:h-full">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Activity timeline</p>
                <p className="mt-1 text-sm text-slate-500">
                  Users updated from {formatReportDate(rangeStart)} to{" "}
                  {formatReportDate(rangeEnd)}.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <SummaryBars report={report} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Customers
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.statistics.totalCustomers.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Sellers
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.statistics.totalSellers.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Admins
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.statistics.totalAdmins.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ActivityTabs
                customers={report.activities.customers}
                sellers={report.activities.sellers}
                admins={report.activities.admins}
              />
            </div>
          </article>
        </div>

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
                      <span className="font-medium text-slate-700">
                        {role.toLowerCase()}
                      </span>
                      <span className="font-semibold text-slate-950">
                        {value.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className={`h-3 rounded-full ${tone}`}
                        style={{ width: `${width}%` }}
                      />
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
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Operational activity log</p>
            <p className="mt-1 text-sm text-slate-500">
              Recent events from users, orders, returns, cancellations, products,
              reports, and system configuration.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {[
              ["Orders", report.eventSummary.orderEvents],
              ["Products", report.eventSummary.productEvents],
              ["Returns", report.eventSummary.returnEvents],
              ["Configs", report.eventSummary.configEvents],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
              >
                <span className="font-semibold text-slate-900">{value.toLocaleString("vi-VN")}</span>{" "}
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 max-h-[36rem] overflow-auto">
          <table className="w-full min-w-[860px] table-fixed divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Timestamp
                </th>
                <th className="w-[16%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Entity
                </th>
                <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Actor
                </th>
                <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Title
                </th>
                <th className="w-[28%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.recentEvents.length > 0 ? (
                report.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      {formatReportDate(event.occurredAt)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${eventTone(
                            event.entityType,
                          )}`}
                        >
                          {event.entityType}
                        </span>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {event.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm font-medium text-slate-900 break-words">
                      {event.actorLabel}
                    </td>
                    <td className="px-4 py-4 align-top text-sm font-semibold text-slate-900">
                      <p className="break-words">{event.title}</p>
                      {event.status ? (
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                          {event.status}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top text-sm leading-6 text-slate-600 break-words">
                      {event.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No recent events found in this reporting window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
