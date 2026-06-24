"use client";

import {
  Button,
  DetailSection,
  EmptyState,
  FormField,
  ModalShell,
  SelectInput,
  TextInput,
} from "@itech/shared";
import TinyMCEEditor from "../../../components/tinymce-editor";
import { formatVariantAttributes, htmlToPlainText } from "../helpers";
import type {
  CategoryOption,
  DraftState,
  ProductDetail,
  VariantDraftRow,
} from "../types";

type ProductFormModalProps = {
  open: boolean;
  draft: DraftState;
  categories: CategoryOption[];
  selectedProduct: ProductDetail | null;
  saving: boolean;
  variantDrafts: VariantDraftRow[];
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: (updater: (current: DraftState) => DraftState) => void;
  onHandlePreviewImages: (files: FileList | null) => void;
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
  onResetVariantImage: (rowId: string) => void;
};

export default function ProductFormModal({
  open,
  draft,
  categories,
  selectedProduct,
  saving,
  variantDrafts,
  onClose,
  onSubmit,
  onDraftChange,
  onHandlePreviewImages,
  onAddVariantAttribute,
  onUpdateVariantAttribute,
  onRemoveVariantAttribute,
  onUpdateVariantRow,
  onSetVariantImage,
  onResetVariantImage,
}: ProductFormModalProps) {
  const hasVariants = Boolean(selectedProduct?.ProductVariant?.length);

  return (
    <ModalShell
      open={open}
      title="Edit product"
      subtitle="Update core information, media, category assignment, and inventory."
      onClose={onClose}
      widthClass="max-w-6xl"
      eyebrow="Seller products"
    >
      <div className="grid min-h-full gap-0 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:items-start">
        <div className="min-w-0 space-y-5 p-6 lg:border-r lg:border-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Product name" className="md:col-span-2">
              <TextInput
                value={draft.name}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Classic Sneakers"
              />
            </FormField>

            <FormField label="Category">
              <SelectInput
                value={draft.categoryId}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Price">
              <TextInput
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
              />
            </FormField>

            <FormField
              label="Stock quantity"
              className="md:col-span-2"
              hint={
                hasVariants
                  ? "Stock is calculated from variant inventory for this product."
                  : "Update the stock level for this simple product."
              }
            >
              <TextInput
                type="number"
                min={0}
                value={draft.stockQuantity}
                disabled={hasVariants}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    stockQuantity: event.target.value,
                  }))
                }
                placeholder="50"
                className="disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </FormField>

            {hasVariants ? (
              <div className="md:col-span-2 rounded-[1.5rem] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This product has variants, so stock quantity is managed by variant inventory.
              </div>
            ) : null}

            <FormField label="Description" className="md:col-span-2">
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
            </FormField>
          </div>

          {hasVariants ? (
            <DetailSection
              title="Variants"
              description="Update quantity, price adjustment, attributes, and image for each existing variant."
              className="!p-5 shadow-sm"
            >
              <div className="mt-4 space-y-4">
                {variantDrafts.length > 0 ? (
                  variantDrafts.map((variant, index) => (
                    <div
                      key={variant.backendId}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Variant {index + 1}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatVariantAttributes(variant.attributes) ||
                              "Add attributes like Size, Color, Material."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {variant.attributes.map((attribute) => (
                          <div
                            key={attribute.id}
                            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                          >
                            <TextInput
                              value={attribute.key}
                              onChange={(event) =>
                                onUpdateVariantAttribute(
                                  variant.backendId,
                                  attribute.id,
                                  "key",
                                  event.target.value,
                                )
                              }
                              placeholder="Attribute name"
                              className="!bg-white"
                            />
                            <TextInput
                              value={attribute.value}
                              onChange={(event) =>
                                onUpdateVariantAttribute(
                                  variant.backendId,
                                  attribute.id,
                                  "value",
                                  event.target.value,
                                )
                              }
                              placeholder="Attribute value"
                              className="!bg-white"
                            />
                            <Button
                              onClick={() =>
                                onRemoveVariantAttribute(
                                  variant.backendId,
                                  attribute.id,
                                )
                              }
                              variant="secondary"
                              className="rounded-2xl px-4 py-3 text-xs font-semibold text-slate-600 shadow-none"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}

                        <Button
                          onClick={() => onAddVariantAttribute(variant.backendId)}
                          size="sm"
                          variant="secondary"
                          className="rounded-full !border-dashed !border-slate-300 !bg-white !px-4 !py-2 !text-xs !text-slate-600 !shadow-none hover:!bg-slate-50"
                        >
                          Add attribute
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <FormField
                          label="Quantity"
                          labelClassName="text-xs uppercase tracking-[0.2em] !text-slate-500"
                        >
                          <TextInput
                            type="number"
                            min={0}
                            value={variant.quantity}
                            onChange={(event) =>
                              onUpdateVariantRow(variant.backendId, (current) => ({
                                ...current,
                                quantity: event.target.value,
                              }))
                            }
                            placeholder="10"
                            className="!bg-white"
                          />
                        </FormField>

                        <FormField
                          label="Price adjustment"
                          labelClassName="text-xs uppercase tracking-[0.2em] !text-slate-500"
                        >
                          <TextInput
                            type="number"
                            value={variant.priceAdjustment}
                            onChange={(event) =>
                              onUpdateVariantRow(variant.backendId, (current) => ({
                                ...current,
                                priceAdjustment: event.target.value,
                              }))
                            }
                            placeholder="0"
                            className="!bg-white"
                          />
                        </FormField>
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
                                onSetVariantImage(variant.backendId, file);
                                event.currentTarget.value = "";
                              }}
                            />
                            {variant.imagePreview ? (
                              <img
                                src={variant.imagePreview}
                                alt={`Variant ${index + 1}`}
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
                          {variant.imagePreview ? (
                            <Button
                              onClick={() => onResetVariantImage(variant.backendId)}
                              size="sm"
                              variant="ghost"
                              className="!h-auto !rounded-full !px-0 !py-0 !text-xs !font-semibold !text-slate-500 hover:!bg-transparent hover:!text-slate-900"
                            >
                              Reset image change
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No variants found."
                    description="This product should have variant rows, but none were loaded."
                    className="py-6"
                  />
                )}
              </div>
            </DetailSection>
          ) : null}
        </div>

        <div className="min-w-0 space-y-5 bg-slate-50 p-6">
          <DetailSection
            title="Images"
            description="Upload new images to replace the existing gallery."
            className="!p-5 shadow-sm"
          >
            <label className="mt-4 block cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  onHandlePreviewImages(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <div className="text-sm font-semibold text-slate-700">Choose images</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Click to upload product gallery images.
              </p>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {draft.previews.length > 0 ? (
                draft.previews.map((preview, index) => (
                  <div
                    key={`${preview}-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No new images selected." className="col-span-full py-6" />
              )}
            </div>
          </DetailSection>

          <DetailSection title="Current preview" className="!p-5 shadow-sm">
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
              <div className="aspect-[16/10] bg-slate-100">
                {selectedProduct?.images?.[0] ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt="Current preview"
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
                    {hasVariants ? "Variants on" : "Simple stock"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {draft.price || "0"} VND
                  </span>
                </div>
              </div>
            </div>
          </DetailSection>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button onClick={onClose} variant="secondary" className="!shadow-none">
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={saving}
              variant="primary"
              className="!border !border-slate-900 !shadow-none"
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
