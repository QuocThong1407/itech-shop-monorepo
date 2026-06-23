import type { RevenueGroupBy } from "../types";

type RevenueFilterFormProps = {
  rangeStart: string;
  rangeEnd: string;
  groupBy: RevenueGroupBy;
  exportHref: string;
};

export default function RevenueFilterForm({
  rangeStart,
  rangeEnd,
  groupBy,
  exportHref,
}: RevenueFilterFormProps) {
  return (
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
  );
}
