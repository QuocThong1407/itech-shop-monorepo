import { redirect } from "next/navigation";
import {
  buildReportExportHref,
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
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
    groupBy?: "day" | "month" | "year";
  }>;
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

function RevenueComboChart({
  rows,
  groupBy,
}: {
  rows: RevenueReport["rows"];
  groupBy: "day" | "month" | "year";
}) {
  if (rows.length === 0) {
    return (
      <div className="grid h-[20rem] place-items-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No revenue data for the selected range.
      </div>
    );
  }

  const chartRows = rows.slice(-10);
  const width = 760;
  const height = 320;
  const padding = { top: 24, right: 24, bottom: 56, left: 24 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    ...chartRows.flatMap((row) => [row.income, row.refund, row.netRevenue]),
    1,
  );
  const slotWidth = innerWidth / chartRows.length;
  const barWidth = Math.max(slotWidth * 0.24, 12);

  const linePoints = chartRows
    .map((row, index) => {
      const x = padding.left + slotWidth * index + slotWidth / 2;
      const y =
        padding.top + innerHeight - (Math.max(row.netRevenue, 0) / maxValue) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-sky-500" />
          Income
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          Refund
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-900" />
          Net revenue
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[20rem] w-full">
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

        {chartRows.map((row, index) => {
          const x = padding.left + slotWidth * index + slotWidth / 2;
          const incomeHeight = (Math.max(row.income, 0) / maxValue) * innerHeight;
          const refundHeight = (Math.max(row.refund, 0) / maxValue) * innerHeight;
          const incomeY = padding.top + innerHeight - incomeHeight;
          const refundY = padding.top + innerHeight - refundHeight;
          const label = groupBy === "day" ? formatReportDate(row.period) : row.period;

          return (
            <g key={row.period}>
              <rect
                x={x - barWidth - 2}
                y={incomeY}
                width={barWidth}
                height={incomeHeight}
                rx="10"
                fill="#38bdf8"
              />
              <rect
                x={x + 2}
                y={refundY}
                width={barWidth}
                height={refundHeight}
                rx="10"
                fill="#fb7185"
              />
              <text
                x={x}
                y={height - 22}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {label}
              </text>
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={linePoints}
        />

        {chartRows.map((row, index) => {
          const x = padding.left + slotWidth * index + slotWidth / 2;
          const y =
            padding.top + innerHeight - (Math.max(row.netRevenue, 0) / maxValue) * innerHeight;
          return <circle key={`${row.period}-point`} cx={x} cy={y} r="4" fill="#0f172a" />;
        })}
      </svg>
    </div>
  );
}

export default async function RevenueReportPage({
  searchParams,
}: RevenuePageProps) {
  const params = (await searchParams) ?? {};
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
  const exportHref = buildReportExportHref("revenue", {
    startDate: rangeStart,
    endDate: rangeEnd,
    groupBy,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
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

            <div className="mt-6">
              <RevenueComboChart rows={rows} groupBy={groupBy} />
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
