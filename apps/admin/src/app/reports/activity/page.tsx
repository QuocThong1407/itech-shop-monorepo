import { redirect } from "next/navigation";
import {
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
};

type ActivityPageProps = {
  searchParams?: {
    startDate?: string;
    endDate?: string;
  };
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

export default async function ActivityReportPage({
  searchParams,
}: ActivityPageProps) {
  const params = searchParams ?? {};
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

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
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
            <button
              type="submit"
              className="sm:col-span-2 h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
            >
              Apply filters
            </button>
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
        <div className="space-y-6">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Activity timeline</p>
                <p className="mt-1 text-sm text-slate-500">
                  Users updated from {formatReportDate(rangeStart)} to{" "}
                  {formatReportDate(rangeEnd)}.
                </p>
              </div>
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
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
