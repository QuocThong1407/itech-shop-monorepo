"use client";

import { ModalShell } from "@itech/shared";
import type { CategoryFormState, ModalMode } from "../types";

type CategoryFormModalProps = {
  modalMode: ModalMode;
  formState: CategoryFormState;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: React.Dispatch<React.SetStateAction<CategoryFormState>>;
};

export default function CategoryFormModal({
  modalMode,
  formState,
  saving,
  onClose,
  onSubmit,
  onFormChange,
}: CategoryFormModalProps) {
  const open = modalMode === "add" || modalMode === "edit";

  return (
    <ModalShell
      open={open}
      eyebrow={modalMode === "add" ? "Add category" : "Edit category"}
      title={modalMode === "add" ? "Create a new category" : "Update category information"}
      onClose={onClose}
      widthClass="max-w-4xl"
    >
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Category name</span>
            <input
              value={formState.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
              placeholder="e.g. Electronics"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                onFormChange((current) => ({
                  ...current,
                  image: file,
                  preview: file ? URL.createObjectURL(file) : current.preview,
                }));
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />
          </label>

          <div className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Preview</span>
            <div className="flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {formState.preview ? (
                  <img
                    src={formState.preview}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Upload a category image to make the catalog more visual and easier to scan.
              </p>
            </div>
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={formState.description}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
              placeholder="Short description..."
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSubmit}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : modalMode === "add" ? "Create category" : "Save changes"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
