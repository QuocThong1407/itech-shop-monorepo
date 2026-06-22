"use client";

import { EmptyState, ModalShell } from "@itech/shared";
import { promotionScopeTabs, scopeMeta } from "../constants";
import type { CatalogItem, DraftState, ScopeType, ViewMode } from "../types";

type PromotionFormModalProps = {
  viewMode: ViewMode;
  draft: DraftState;
  saving: boolean;
  categories: CatalogItem[];
  filteredResourceItems: CatalogItem[];
  resourceSearch: string;
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: React.Dispatch<React.SetStateAction<DraftState>>;
  onResourceSearchChange: (value: string) => void;
};

export default function PromotionFormModal({
  viewMode,
  draft,
  saving,
  categories,
  filteredResourceItems,
  resourceSearch,
  onClose,
  onSubmit,
  onDraftChange,
  onResourceSearchChange,
}: PromotionFormModalProps) {
  const open = viewMode === "add" || viewMode === "edit";

  return (
    <ModalShell
      open={open}
      eyebrow="Promotions"
      title={viewMode === "add" ? "Create promotion" : "Edit promotion"}
      subtitle="Configure timing, scope, and campaign banner."
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_0.92fr]">
        <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Promotion name</span>
              <input
                value={draft.name}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Summer Flash Sale"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={draft.description}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Describe the campaign and what it highlights."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Start date</span>
              <input
                type="datetime-local"
                value={draft.startDate}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">End date</span>
              <input
                type="datetime-local"
                value={draft.endDate}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Scope</p>
                <p className="mt-1 text-sm text-slate-500">{scopeMeta[draft.scopeType].hint}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {promotionScopeTabs.map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() =>
                    onDraftChange((current) => ({
                      ...current,
                      scopeType: scope,
                    }))
                  }
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    draft.scopeType === scope
                      ? "border-[#008ECC] bg-white shadow-[0_10px_24px_rgba(0,142,204,0.10)]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{scopeMeta[scope].label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{scopeMeta[scope].hint}</p>
                </button>
              ))}
            </div>
          </div>

          {draft.scopeType !== "ALL" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {draft.scopeType === "PRODUCT" ? "Select products" : "Select categories"}
                  </p>
                  <p className="text-sm text-slate-500">Use search to find targets faster.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {(draft.scopeType === "PRODUCT" ? draft.productIds.length : draft.categoryIds.length) || 0} selected
                </span>
              </div>

              <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600">
                <span className="text-slate-400">Search</span>
                <input
                  value={resourceSearch}
                  onChange={(event) => onResourceSearchChange(event.target.value)}
                  placeholder="Type to filter"
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-3">
                {filteredResourceItems.length === 0 ? (
                  <EmptyState
                    title="No items match your search"
                    description="Try another keyword."
                    className="bg-slate-50"
                  />
                ) : (
                  filteredResourceItems.map((item) => {
                    const isProduct = draft.scopeType === "PRODUCT";
                    const selected = isProduct
                      ? draft.productIds.includes(item.id)
                      : draft.categoryIds.includes(item.id);

                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                          selected
                            ? "border-[#008ECC] bg-sky-50/70"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            if (isProduct) {
                              onDraftChange((current) => ({
                                ...current,
                                productIds: checked
                                  ? [...current.productIds, item.id]
                                  : current.productIds.filter((value) => value !== item.id),
                              }));
                              return;
                            }

                            onDraftChange((current) => ({
                              ...current,
                              categoryIds: checked
                                ? [...current.categoryIds, item.id]
                                : current.categoryIds.filter((value) => value !== item.id),
                            }));
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-[#008ECC] focus:ring-[#008ECC]"
                        />

                        {isProduct ? (
                          <div className="h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs text-slate-400">
                                P
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">
                            C
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              {scopeMeta.ALL.hint}
            </div>
          )}
        </div>

        <div className="space-y-5 bg-slate-50 p-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Banner image</p>
            <p className="mt-1 text-sm text-slate-500">
              A hero image helps the promotion feel more premium.
            </p>

            <label className="mt-4 block cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (!file) {
                    onDraftChange((current) => ({
                      ...current,
                      image: null,
                      preview: current.preview,
                    }));
                    return;
                  }

                  onDraftChange((current) => ({
                    ...current,
                    image: file,
                    preview: URL.createObjectURL(file),
                  }));
                }}
              />
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white text-xs font-semibold text-slate-500 shadow-sm">
                  {draft.preview ? (
                    <img src={draft.preview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    "Upload"
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {draft.preview ? "Change banner" : "Choose image"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    PNG, JPG, or WebP. Use something high contrast for a better campaign card.
                  </p>
                </div>
              </div>
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Live preview</p>
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
              <div className="aspect-[16/9] bg-slate-100">
                {draft.preview ? (
                  <img src={draft.preview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">
                    Banner preview
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <p className="text-sm font-semibold text-slate-950">
                  {draft.name || "Promotion title"}
                </p>
                <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                  {draft.description || "Write a short description to introduce the campaign."}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {scopeMeta[draft.scopeType].label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {draft.startDate || "Start time"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {draft.endDate || "End time"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
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
              disabled={saving}
              className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : viewMode === "add" ? "Create promotion" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
