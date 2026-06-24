"use client";

import { Button, FormField, ModalShell, TextArea, TextInput } from "@itech/shared";
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
          <FormField label="Category name" hint="This is the name that will be displayed in the catalog.">
            <TextInput
              value={formState.name}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="e.g. Electronics"
            />
          </FormField>

          <FormField label="Image" hint="Choose a square or landscape image for cleaner category cards.">
            <TextInput
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
            />
          </FormField>

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

          <FormField label="Description" className="sm:col-span-2">
            <TextArea
              value={formState.description}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              placeholder="Short description..."
            />
          </FormField>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button onClick={onClose} variant="secondary" className="!shadow-none">
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={onSubmit}
            variant="primary"
            className="!border !border-slate-900 !shadow-none"
          >
            {saving ? "Saving..." : modalMode === "add" ? "Create category" : "Save changes"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
