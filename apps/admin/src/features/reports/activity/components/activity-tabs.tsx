"use client";

import { useState } from "react";
import { formatReportDate } from "../../../../lib/report-format";
import type { ActivityRowBase } from "../types";

type ActivityTabsProps = {
  customers: Array<ActivityRowBase & { totalOrders?: number }>;
  sellers: Array<ActivityRowBase & { totalProducts?: number }>;
  admins: Array<ActivityRowBase & { totalReportsGenerated?: number }>;
};

function ActivityTable<T extends ActivityRowBase>({
  title,
  rows,
  extraLabel,
  renderExtra,
}: {
  title: string;
  rows: T[];
  extraLabel: string;
  renderExtra: (row: T) => string;
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-[34%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Username
              </th>
              <th className="w-[34%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Last active
              </th>
              <th className="w-[32%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {extraLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.userId}>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    <p className="truncate">{row.username}</p>
                    <p className="truncate text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatReportDate(row.lastActive)}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                    {renderExtra(row)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-sm text-slate-500">
                  No {title.toLowerCase()} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default function ActivityTabs({ customers, sellers, admins }: ActivityTabsProps) {
  const [tab, setTab] = useState<"customers" | "sellers" | "admins">("customers");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {(
          [
            ["customers", "Customers"],
            ["sellers", "Sellers"],
            ["admins", "Admins"],
          ] as const
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-t-2xl border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-slate-200 border-b-white bg-white text-slate-900 shadow-[0_-6px_20px_rgba(15,23,42,0.04)]"
                  : "border-transparent bg-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {tab === "customers" ? (
        <ActivityTable
          title="Customers"
          rows={customers}
          extraLabel="Orders"
          renderExtra={(row) => (row.totalOrders ?? 0).toLocaleString("vi-VN")}
        />
      ) : null}

      {tab === "sellers" ? (
        <ActivityTable
          title="Sellers"
          rows={sellers}
          extraLabel="Products"
          renderExtra={(row) => (row.totalProducts ?? 0).toLocaleString("vi-VN")}
        />
      ) : null}

      {tab === "admins" ? (
        <ActivityTable
          title="Admins"
          rows={admins}
          extraLabel="Reports"
          renderExtra={(row) => (row.totalReportsGenerated ?? 0).toLocaleString("vi-VN")}
        />
      ) : null}
    </div>
  );
}
