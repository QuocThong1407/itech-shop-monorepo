import { redirect } from "next/navigation";
import {
  formatReportDate,
  formatReportMoney,
  readReportJson,
  startDate,
} from "../../../lib/report-api";

export const dynamic = "force-dynamic";

type RevenueReport = {
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

type RevenuePageProps = {
  searchParams?: {
    startDate?: string;
    endDate?: string;
    groupBy?: "day" | "month" | "year";
  };
};

function parseDate(value: string | string[] | undefined, fallback: string) {
  if (typeof value === "string" && value) return value;
  return fallback;
}

function parseGroupBy(value: string | string[] | undefined) {
  if (value === "month" || value === "year") return value;
  return "day" as const;
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

export default async function RevenueReportPage({
  searchParams,
}: RevenuePageProps) {
  const params = searchParams ?? {};
  const rangeStart = parseDate(params.startDate, startDate(30));
  const rangeEnd = parseDate(params.endDate, startDate(0));
  const groupBy = parseGroupBy(params.groupBy);

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

  const rows = report.rows;
  const maxNet = Math.max(...rows.map((row) => row.netRevenue), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
              Revenue insights
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Revenue Report
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review income, refunds, and net revenue with the same report flow
              as the old admin panel, but arranged more cleanly.
            </p>
          </div>

          <form
            method="get"
            className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:min-w-[34rem]"
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
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Group by
              </span>
              <select
                name="groupBy"
                defaultValue={groupBy}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
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

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Net revenue"
          value={formatReportMoney(report.summary.netRevenue)}
          note="Income minus refunds"
          accent="bg-[#008ECC]"
        />
        <MetricCard
          title="Gross income"
          value={formatReportMoney(report.summary.totalIncome)}
          note="Successful payment volume"
          accent="bg-emerald-500"
        />
        <MetricCard
          title="Refunds"
          value={formatReportMoney(report.summary.totalRefund)}
          note="Approved returns and cancellations"
          accent="bg-rose-500"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Revenue trend</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatReportDate(rangeStart)} to {formatReportDate(rangeEnd)}.
                </p>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {groupBy.toUpperCase()} grouped
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {rows.length > 0 ? (
                rows.map((row) => {
                  const width = Math.max((row.netRevenue / maxNet) * 100, 6);
                  return (
                    <div key={row.period} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-700">
                          {groupBy === "day" ? formatReportDate(row.period) : row.period}
                        </span>
                        <span className="font-semibold text-slate-950">
                          {formatReportMoney(row.netRevenue)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className="h-3 rounded-full bg-[linear-gradient(90deg,_#008ECC_0%,_#1d4ed8_100%)]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Income {formatReportMoney(row.income)}</span>
                        <span>Refund {formatReportMoney(row.refund)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No revenue data for the selected range.
                </div>
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Revenue table</p>
              <p className="mt-1 text-sm text-slate-500">
                Period summary with income, refund, and net revenue.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-[34%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Period
                    </th>
                    <th className="w-[22%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Income
                    </th>
                    <th className="w-[22%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Refund
                    </th>
                    <th className="w-[22%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Net revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length > 0 ? (
                    rows.map((row) => (
                      <tr key={row.period}>
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {groupBy === "day" ? formatReportDate(row.period) : row.period}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatReportMoney(row.income)}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatReportMoney(row.refund)}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {formatReportMoney(row.netRevenue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-sm text-slate-500">
                        No revenue rows found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold text-slate-900">Transaction breakdown</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Completed payments
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.details.totalCompletedPayments.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Approved returns
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.details.totalApprovedReturns.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Approved cancellations
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {report.details.totalApprovedCancellations.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold text-slate-900">Report summary</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Grouped by <span className="font-semibold text-slate-900">{groupBy}</span>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Total periods{" "}
                <span className="font-semibold text-slate-900">
                  {rows.length.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Date range{" "}
                <span className="font-semibold text-slate-900">
                  {formatReportDate(rangeStart)} - {formatReportDate(rangeEnd)}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

