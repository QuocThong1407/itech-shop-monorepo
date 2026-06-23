"use client";

import { EmptyState, ModalShell } from "@itech/shared";
import { IMPORT_TEMPLATE_BASE } from "../constants";
import type { ProductImportResult } from "../types";

type ProductImportModalProps = {
  open: boolean;
  importFile: File | null;
  importContinueOnError: boolean;
  importResult: ProductImportResult | null;
  importing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFileChange: (file: File | null) => void;
  onContinueOnErrorChange: (value: boolean) => void;
  onResetResult: () => void;
};

export default function ProductImportModal({
  open,
  importFile,
  importContinueOnError,
  importResult,
  importing,
  onClose,
  onSubmit,
  onFileChange,
  onContinueOnErrorChange,
  onResetResult,
}: ProductImportModalProps) {
  return (
    <ModalShell
      open={open}
      title="Import products"
      subtitle="Upload a CSV or Excel file to create products in bulk for admin or seller catalogs."
      onClose={onClose}
      widthClass="max-w-4xl"
      eyebrow="Products"
    >
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Template files</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use the provided headers exactly. For products with variants, keep
              the <code>variants</code> column as a JSON array string.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`${IMPORT_TEMPLATE_BASE}/product-import-template.csv`}
                download
                className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Download CSV
              </a>
              <a
                href={`${IMPORT_TEMPLATE_BASE}/product-import-template.xlsx`}
                download
                className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Download XLSX
              </a>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Import file</span>
              <label className="mt-3 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:bg-slate-100">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(event) => {
                    onFileChange(event.target.files?.[0] ?? null);
                    onResetResult();
                  }}
                />
                <span className="text-base font-semibold text-slate-900">
                  {importFile ? importFile.name : "Choose CSV or XLSX file"}
                </span>
                <span className="mt-2 text-sm leading-6 text-slate-500">
                  Maximum 10MB. The backend will parse the first worksheet for
                  Excel files.
                </span>
              </label>
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={importContinueOnError}
                onChange={(event) =>
                  onContinueOnErrorChange(event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              <span className="text-sm leading-6 text-slate-600">
                Continue importing valid rows even if some rows fail.
              </span>
            </label>

            <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Required columns: <code>name</code>, <code>price</code>,{" "}
              <code>categoryId</code>. Use either <code>stockQuantity</code> for
              simple products or <code>variants</code> for variable products.{" "}
              <code>sellerUserId</code> is required when admin imports for a
              seller.
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={importing}
              className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing ? "Importing..." : "Start import"}
            </button>
          </div>
        </div>

        <div className="space-y-5 bg-slate-50 p-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Sample row format</p>
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-600">
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-900">name</td>
                      <td className="px-4 py-3">Classic Sneakers</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        description
                      </td>
                      <td className="px-4 py-3">
                        {`<p>Lightweight sneakers for daily wear</p>`}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-900">variants</td>
                      <td className="px-4 py-3 text-xs leading-6">
                        {`[{"variantAttributes":{"size":"M","color":"Black"},"quantity":10,"priceAdjustment":0}]`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Import result</p>
            {importResult ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Total rows
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {importResult.total}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Success
                    </p>
                    <p className="mt-2 text-xl font-semibold text-emerald-900">
                      {importResult.successCount}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                      Failed
                    </p>
                    <p className="mt-2 text-xl font-semibold text-rose-900">
                      {importResult.failureCount}
                    </p>
                  </div>
                </div>

                <div className="max-h-[320px] overflow-y-auto rounded-[1.5rem] border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {importResult.results.map((row) => (
                        <tr key={`${row.index}-${row.name ?? "row"}`}>
                          <td className="px-4 py-3 text-slate-600">{row.index}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                row.success
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {row.success ? "Imported" : "Failed"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.name || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.success
                              ? row.productId || "Created successfully"
                              : row.error || "Unknown error"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Import summary will appear here after you upload a file."
                className="mt-4 py-8"
              />
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
