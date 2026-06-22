"use client";

import { EmptyState, ModalShell } from "@itech/shared";
import TinyMCEEditor from "../../../components/tinymce-editor";
import { htmlToPlainText, variantAttributesLabel } from "../helpers";
import type {
  CategoryOption,
  DraftState,
  ModalMode,
  UserOption,
  VariantDraftRow,
} from "../types";

type ProductFormModalProps = {
  open: boolean;
  modalMode: Exclude<ModalMode, "view" | null>;
  draft: DraftState;
  categories: CategoryOption[];
  sellers: UserOption[];
  editingId: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: (updater: (current: DraftState) => DraftState) => void;
  onAddVariantRow: () => void;
  onRemoveVariantRow: (rowId: string) => void;
  onAddVariantAttribute: (rowId: string) => void;
  onUpdateVariantAttribute: (
    rowId: string,
    attributeId: string,
    field: "key" | "value",
    value: string,
  ) => void;
  onRemoveVariantAttribute: (rowId: string, attributeId: string) => void;
  onUpdateVariantRow: (
    rowId: string,
    updater: (row: VariantDraftRow) => VariantDraftRow,
  ) => void;
  onSetVariantImage: (rowId: string, file: File | null) => void;
  onOpenImages: (files: FileList | null) => void;
  onRemovePreview: (index: number) => void;
};

export default function ProductFormModal({
  open,
  modalMode,
  draft,
  categories,
  sellers,
  editingId,
  saving,
  onClose,
  onSubmit,
  onDraftChange,
  onAddVariantRow,
  onRemoveVariantRow,
  onAddVariantAttribute,
  onUpdateVariantAttribute,
  onRemoveVariantAttribute,
  onUpdateVariantRow,
  onSetVariantImage,
  onOpenImages,
  onRemovePreview,
}: ProductFormModalProps) {
  return (
    <ModalShell
      open={open}
      title={modalMode === "add" ? "Create product" : "Edit product"}
      subtitle="Manage core information, media, category assignment, and inventory."
      onClose={onClose}
      widthClass="max-w-6xl"
      eyebrow="Products"
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5 p-6 lg:border-r lg:border-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Product name</span>
              <input
                value={draft.name}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Classic Sneakers"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                <TinyMCEEditor
                  value={draft.description}
                  placeholder="Write a rich product description with HTML formatting."
                  onChange={(content) =>
                    onDraftChange((current) => ({
                      ...current,
                      description: content,
                    }))
                  }
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Price</span>
              <input
                type="number"
                min={0}
                value={draft.price}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                placeholder="120000"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Stock quantity</span>
              <input
                type="number"
                min={0}
                value={draft.stockQuantity}
                disabled={draft.useVariants}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    stockQuantity: event.target.value,
                  }))
                }
                placeholder="50"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select
                value={draft.categoryId}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Seller</span>
              <select
                value={draft.sellerUserId}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    sellerUserId: event.target.value,
                  }))
                }
                disabled={Boolean(editingId)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Select seller</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.username} - {seller.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Variants</p>
                <p className="mt-1 text-sm text-slate-500">
                  Build each variant as its own row with attributes, quantity,
                  price adjustment, and an optional image.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onDraftChange((current) => {
                    const nextUseVariants = !current.useVariants;
                    return {
                      ...current,
                      useVariants: nextUseVariants,
                      variants:
                        nextUseVariants && current.variants.length === 0
                          ? [
                              {
                                id: `variant-${Date.now()}`,
                                backendId: null,
                                attributes: [
                                  {
                                    id: `attr-${Date.now()}`,
                                    key: "",
                                    value: "",
                                  },
                                ],
                                quantity: "",
                                priceAdjustment: "",
                                imageFile: null,
                                imagePreview: null,
                              },
                            ]
                          : current.variants,
                    };
                  })
                }
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  draft.useVariants
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {draft.useVariants ? "Enabled" : "Disabled"}
              </button>
            </div>

            {draft.useVariants ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Variant rows
                  </p>
                  <button
                    type="button"
                    onClick={onAddVariantRow}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Add row
                  </button>
                </div>

                {draft.variants.length > 0 ? (
                  draft.variants.map((row, rowIndex) => (
                    <div
                      key={row.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Variant {rowIndex + 1}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {variantAttributesLabel(row.attributes) ||
                              "Add attributes like Size, Color, Material."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveVariantRow(row.id)}
                          className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {row.attributes.map((attribute) => (
                          <div
                            key={attribute.id}
                            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                          >
                            <input
                              value={attribute.key}
                              onChange={(event) =>
                                onUpdateVariantAttribute(
                                  row.id,
                                  attribute.id,
                                  "key",
                                  event.target.value,
                                )
                              }
                              placeholder="Attribute name"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                            <input
                              value={attribute.value}
                              onChange={(event) =>
                                onUpdateVariantAttribute(
                                  row.id,
                                  attribute.id,
                                  "value",
                                  event.target.value,
                                )
                              }
                              placeholder="Attribute value"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                onRemoveVariantAttribute(row.id, attribute.id)
                              }
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => onAddVariantAttribute(row.id)}
                          className="rounded-full border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Add attribute
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Quantity
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={row.quantity}
                            onChange={(event) =>
                              onUpdateVariantRow(row.id, (current) => ({
                                ...current,
                                quantity: event.target.value,
                              }))
                            }
                            placeholder="10"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Price adjustment
                          </span>
                          <input
                            type="number"
                            value={row.priceAdjustment}
                            onChange={(event) =>
                              onUpdateVariantRow(row.id, (current) => ({
                                ...current,
                                priceAdjustment: event.target.value,
                              }))
                            }
                            placeholder="0"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                          />
                        </label>
                      </div>

                      <div className="mt-4">
                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Variant image
                          </span>
                          <label className="flex min-h-[118px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-center transition hover:bg-slate-50">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                onSetVariantImage(row.id, file);
                                event.currentTarget.value = "";
                              }}
                            />
                            {row.imagePreview ? (
                              <img
                                src={row.imagePreview}
                                alt={`Variant ${rowIndex + 1}`}
                                className="h-20 w-20 rounded-2xl object-cover"
                              />
                            ) : (
                              <>
                                <span className="text-sm font-semibold text-slate-700">
                                  Choose image
                                </span>
                                <span className="text-xs leading-5 text-slate-500">
                                  Optional product variant photo
                                </span>
                              </>
                            )}
                          </label>
                          {row.imagePreview ? (
                            <button
                              type="button"
                              onClick={() => onSetVariantImage(row.id, null)}
                              className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                            >
                              Clear image
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No variant rows yet."
                    description="Add one to build size, color, or material options."
                    className="py-6"
                  />
                )}
              </div>
            ) : (
              <EmptyState
                title="Simple stock mode is active."
                description="Turn on variants if this product has multiple combinations."
                className="mt-4 py-6"
              />
            )}
          </div>
        </div>

        <div className="space-y-5 bg-slate-50 p-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Images</p>
            <p className="mt-1 text-sm text-slate-500">
              Upload one or more product images. New uploads replace the current
              gallery on edit.
            </p>
            <label className="mt-4 block cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = event.target.files;
                  if (!files || files.length === 0) return;
                  onOpenImages(files);
                  event.currentTarget.value = "";
                }}
              />
              <div className="text-sm font-semibold text-slate-700">Choose images</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Drag and drop is not required. Click to upload gallery images.
              </p>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {draft.previews.length > 0 ? (
                draft.previews.map((preview, index) => (
                  <div
                    key={`${preview}-${index}`}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemovePreview(index)}
                      className="absolute right-2 top-2 rounded-full bg-slate-950/85 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <EmptyState title="No new images selected yet." className="col-span-full py-6" />
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Draft preview</p>
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
              <div className="aspect-[16/9] bg-slate-100">
                {draft.previews[0] ? (
                  <img
                    src={draft.previews[0]}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">
                    Product preview
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <p className="text-sm font-semibold text-slate-950">
                  {draft.name || "Product title"}
                </p>
                <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                  {htmlToPlainText(draft.description) ||
                    "Write a short product description."}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {draft.useVariants ? "Variants on" : "Simple stock"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {draft.price || "0"} VND
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
              {saving
                ? "Saving..."
                : modalMode === "add"
                  ? "Create product"
                  : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
