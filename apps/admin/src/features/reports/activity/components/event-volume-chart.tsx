import { formatReportDate } from "../../../../lib/report-api";
import type { ActivityReport } from "../types";

type EventVolumeChartProps = {
  recentEvents: ActivityReport["recentEvents"];
};

export default function EventVolumeChart({ recentEvents }: EventVolumeChartProps) {
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
