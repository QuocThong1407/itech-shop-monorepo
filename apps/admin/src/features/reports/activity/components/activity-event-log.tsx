import { EmptyState, StatusBadge, TableCard, TableShell } from "@itech/shared";
import { formatReportDate } from "../../../../lib/report-api";
import { eventTone } from "../helpers";
import type { ActivityReport } from "../types";

type ActivityEventLogProps = {
  report: ActivityReport;
};

export default function ActivityEventLog({ report }: ActivityEventLogProps) {
  return (
    <TableCard
      title="Operational activity log"
      description="Recent events from users, orders, returns, cancellations, products, reports, and system configuration."
      className="rounded-[1.75rem] shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
      actions={
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 h-fit">
          {[
            ["Orders", report.eventSummary.orderEvents],
            ["Products", report.eventSummary.productEvents],
            ["Returns", report.eventSummary.returnEvents],
            ["Configs", report.eventSummary.configEvents],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
            >
              <span className="font-semibold text-slate-900">{value.toLocaleString("vi-VN")}</span>{" "}
              {label}
            </div>
          ))}
        </div>
      }
    >

      <TableShell className="pt-0 mt-5" innerClassName="max-h-[36rem] overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[1080px] table-fixed divide-y divide-slate-200">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Timestamp
              </th>
              <th className="w-[16%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Entity
              </th>
              <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Actor
              </th>
              <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Title
              </th>
              <th className="w-[28%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.recentEvents.length > 0 ? (
              report.recentEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-4 align-top text-sm text-slate-600">
                    {formatReportDate(event.occurredAt)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        className={eventTone(event.entityType)}
                      >
                        {event.entityType}
                      </StatusBadge>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {event.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm font-medium text-slate-900 break-words">
                    {event.actorLabel}
                  </td>
                  <td className="px-4 py-4 align-top text-sm font-semibold text-slate-900">
                    <p className="break-words">{event.title}</p>
                    {event.status ? (
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {event.status}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top text-sm leading-6 text-slate-600 break-words">
                    {event.description}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12">
                  <EmptyState title="No recent events found in this reporting window." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>
    </TableCard>
  );
}
