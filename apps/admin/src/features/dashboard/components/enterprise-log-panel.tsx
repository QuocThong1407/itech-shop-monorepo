import { Badge } from "@itech/shared";
import { activityTone, formatShortDate } from "../helpers";
import type { ActivityReport, QuickNote } from "../types";

type EnterpriseLogPanelProps = {
  activityReport: ActivityReport;
  quickNotes: QuickNote[];
};

export default function EnterpriseLogPanel({
  activityReport,
  quickNotes,
}: EnterpriseLogPanelProps) {
  const recentEvents = activityReport.recentEvents.slice(0, 6);

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-semibold text-[#008ECC]">Operational activity</p>
      <h3 className="mt-1 text-xl font-semibold text-slate-950">Recent enterprise log</h3>

      <div className="mt-6 max-h-[40rem] space-y-6 overflow-y-auto pr-1">
        <div className="space-y-3">
          {quickNotes.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.title}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{item.value}</p>
                </div>
                <Badge tone="neutral" className="bg-slate-100 text-slate-600 ring-slate-200">
                  Live
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {recentEvents.length > 0 ? (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${activityTone(
                          event.entityType,
                        )}`}
                      >
                        {event.entityType}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {event.action}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{event.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{event.description}</p>
                  </div>
                  <div className="max-w-[8rem] text-right text-xs text-slate-400">
                    <p>{formatShortDate(event.occurredAt)}</p>
                    <p className="mt-1 break-words font-medium text-slate-500">{event.actorLabel}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
              No recent activity log entries available.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
