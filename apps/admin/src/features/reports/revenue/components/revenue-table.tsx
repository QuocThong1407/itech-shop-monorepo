import { EmptyState, TableCard, TableShell } from "@itech/shared";
import { formatReportDate, formatReportMoney } from "../../../../lib/report-api";
import type { RevenueGroupBy, RevenueReport } from "../types";

type RevenueTableProps = {
  rows: RevenueReport["rows"];
  groupBy: RevenueGroupBy;
};

export default function RevenueTable({ rows, groupBy }: RevenueTableProps) {
  return (
    <TableCard
      title="Revenue table"
      description="Period summary with income, refund, and net revenue."
      className="rounded-[1.75rem] shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
    >
      <TableShell className="pt-0 mt-5" innerClassName="overflow-x-hidden overflow-y-auto">
        <table className="w-full table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-[25%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Period
              </th>
              <th className="w-[25%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Income
              </th>
              <th className="w-[25%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Refund
              </th>
              <th className="w-[25%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
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
                <td colSpan={4} className="px-5 py-16">
                  <EmptyState title="No revenue rows found." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>
    </TableCard>
  );
}
