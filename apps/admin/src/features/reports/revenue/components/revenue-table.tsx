import { formatReportDate, formatReportMoney } from "../../../../lib/report-api";
import type { RevenueGroupBy, RevenueReport } from "../types";

type RevenueTableProps = {
  rows: RevenueReport["rows"];
  groupBy: RevenueGroupBy;
};

export default function RevenueTable({ rows, groupBy }: RevenueTableProps) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Revenue table</p>
        <p className="mt-1 text-sm text-slate-500">
          Period summary with income, refund, and net revenue.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-[34%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Period
              </th>
              <th className="w-[22%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Income
              </th>
              <th className="w-[22%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Refund
              </th>
              <th className="w-[22%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Net revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.period}>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {groupBy === "day" ? formatReportDate(row.period) : row.period}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatReportMoney(row.income)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatReportMoney(row.refund)}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                    {formatReportMoney(row.netRevenue)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-sm text-slate-500">
                  No revenue rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
