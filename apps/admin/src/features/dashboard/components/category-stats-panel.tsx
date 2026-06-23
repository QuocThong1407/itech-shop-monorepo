import { EmptyState, PanelHeader, StatusBadge, SurfaceCard } from "@itech/shared";
import type { CategoryStats } from "../types";

type CategoryStatsPanelProps = {
  categoryStats: CategoryStats;
};

export default function CategoryStatsPanel({ categoryStats }: CategoryStatsPanelProps) {
  return (
    <SurfaceCard className="flex h-full flex-col rounded-[2rem] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <PanelHeader title="Catalog health" eyebrow="Category stats" />

      <div className="mt-6 grid gap-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-sm font-medium text-slate-500">Total categories</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-4xl font-semibold tracking-tight text-slate-950">
              {categoryStats.total.toLocaleString("vi-VN")}
            </p>
            <StatusBadge tone="neutral" className="bg-sky-50 text-[#008ECC] ring-sky-200">
              Catalog overview
            </StatusBadge>
          </div>
        </div>

        {categoryStats.topCategories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {categoryStats.topCategories.map((category, index) => (
              <div
                key={category.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{category.name}</p>
                    <p className="mt-1 text-xs text-slate-500">Top category #{index + 1}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {category.productCount.toLocaleString("vi-VN")} products
                  </span>
                </div>

                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,_#0f172a_0%,_#008ECC_100%)]"
                    style={{ width: `${Math.min(20 + category.productCount * 6, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No category statistics available." />
        )}
      </div>
    </SurfaceCard>
  );
}
