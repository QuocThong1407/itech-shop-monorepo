import type { ActivityReport } from "../types";

type ActivitySummaryBarsProps = {
  report: ActivityReport;
};

export default function ActivitySummaryBars({ report }: ActivitySummaryBarsProps) {
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
