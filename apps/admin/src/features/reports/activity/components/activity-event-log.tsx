import { formatReportDate } from "../../../../lib/report-api";
import { eventTone } from "../helpers";
import type { ActivityReport } from "../types";

type ActivityEventLogProps = {
  report: ActivityReport;
};

export default function ActivityEventLog({ report }: ActivityEventLogProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Operational activity log</p>
          <p className="mt-1 text-sm text-slate-500">
            Recent events from users, orders, returns, cancellations, products, reports, and
            system configuration.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
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
      </div>

      <div className="mt-5 max-h-[36rem] overflow-auto">
        <table className="w-full min-w-[860px] table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
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
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${eventTone(
                          event.entityType,
                        )}`}
                      >
                        {event.entityType}
                      </span>
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
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No recent events found in this reporting window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
