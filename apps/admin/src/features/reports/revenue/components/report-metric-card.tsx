"use client";

type ReportMetricCardProps = {
  title: string;
  value: string;
  accent: string;
  note: string;
};

export default function ReportMetricCard({
  title,
  value,
  accent,
  note,
}: ReportMetricCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{note}</p>
        </div>
        <div className={`mt-1 h-3 w-3 rounded-full ${accent}`} />
      </div>
    </article>
  );
}
