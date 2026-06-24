import { EmptyState, PanelHeader, StatusBadge, SurfaceCard } from "@itech/shared";
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
    <SurfaceCard className="flex h-full flex-col rounded-[2rem] bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
      <PanelHeader title="Recent enterprise log" eyebrow="Operational activity" />

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
                <StatusBadge tone="neutral" className="bg-slate-100 text-slate-600 ring-slate-200">
                  Live
                </StatusBadge>
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
                      <StatusBadge className={activityTone(event.entityType)}>
                        {event.entityType}
                      </StatusBadge>
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
            <EmptyState title="No recent activity log entries available." className="bg-white" />
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
