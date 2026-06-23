import { formatReportDate } from "../../../../lib/report-api";
import type { RevenueGroupBy, RevenueReport } from "../types";

type RevenueComboChartProps = {
  rows: RevenueReport["rows"];
  groupBy: RevenueGroupBy;
};

export default function RevenueComboChart({ rows, groupBy }: RevenueComboChartProps) {
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
              <text x={x} y={height - 22} textAnchor="middle" fontSize="11" fill="#64748b">
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
          return <circle key={`${row.period}-${index}`} cx={x} cy={y} r="4" fill="#0f172a" />;
        })}
      </svg>
    </div>
  );
}
