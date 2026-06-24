"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createAddressAction as createAddress,
  deleteAddressAction as deleteAddress,
  updateAddressAction,
} from "@/lib/actions";

// ── Types ──────────────────────────────────────────────────────────────────

interface AddressFields {
  phoneNumber: string;
  address: string;
  ward: string | null;
  district: string | null;
  province: string | null;
}

interface Province {
  code: number;
  name: string;
}
interface District {
  code: number;
  name: string;
}
interface Ward {
  code: number;
  name: string;
}

interface CreateProps {
  mode: "create";
}
interface ActionsProps {
  mode: "actions";
  addressId: string;
  initial: AddressFields & { street: string | null };
}
interface EditProps {
  mode: "edit";
  addressId: string;
  initial: AddressFields & { street: string | null };
  onDone: () => void;
}
type Props = CreateProps | ActionsProps | EditProps;

// ── Cascade hook ───────────────────────────────────────────────────────────
function useCascade(initProvince = "", initDistrict = "", initWard = "") {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [province, setProvince] = useState(initProvince);
  const [district, setDistrict] = useState(initDistrict);
  const [ward, setWard] = useState(initWard);

  const [loadingP, setLoadingP] = useState(false);
  const [loadingD, setLoadingD] = useState(false);
  const [loadingW, setLoadingW] = useState(false);

  // load provinces once
  useEffect(() => {
    setLoadingP(true);
    fetch("https://provinces.open-api.vn/api/p/")
      .then((r) => r.json())
      .then(setProvinces)
      .finally(() => setLoadingP(false));
  }, []);

  // load districts when province changes
  useEffect(() => {
    if (!province) {
      setDistricts([]);
      setDistrict("");
      setWards([]);
      setWard("");
      return;
    }
    const p = provinces.find((p) => p.name === province);
    if (!p) return;
    setLoadingD(true);
    fetch(`https://provinces.open-api.vn/api/p/${p.code}?depth=2`)
      .then((r) => r.json())
      .then((data) => {
        setDistricts(data.districts ?? []);
        setDistrict("");
        setWards([]);
        setWard("");
      })
      .finally(() => setLoadingD(false));
  }, [province, provinces]);

  // load wards when district changes
  useEffect(() => {
    if (!district) {
      setWards([]);
      setWard("");
      return;
    }
    const d = districts.find((d) => d.name === district);
    if (!d) return;
    setLoadingW(true);
    fetch(`https://provinces.open-api.vn/api/d/${d.code}?depth=2`)
      .then((r) => r.json())
      .then((data) => {
        setWards(data.wards ?? []);
        setWard("");
      })
      .finally(() => setLoadingW(false));
  }, [district, districts]);

  return {
    provinces,
    districts,
    wards,
    province,
    district,
    ward,
    setProvince,
    setDistrict,
    setWard,
    loadingP,
    loadingD,
    loadingW,
  };
}

// ── Shared UI ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition disabled:opacity-50";
const selectCls = inputCls + " appearance-none cursor-pointer";

function SelectField({
  label,
  value,
  onChange,
  disabled,
  loading,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          className={selectCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
        >
          <option value="">{loading ? "Đang tải..." : placeholder}</option>
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
          ▾
        </span>
      </div>
    </div>
  );
}

// ── AddressFormFields (shared between Create & Edit) ───────────────────────

function AddressFormFields({
  fields,
  setField,
  cascade,
  error,
  isPending,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  fields: AddressFields;
  setField: (k: keyof AddressFields, v: string) => void;
  cascade: ReturnType<typeof useCascade>;
  error: string;
  isPending: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const {
    provinces,
    districts,
    wards,
    province,
    district,
    ward,
    setProvince,
    setDistrict,
    setWard,
    loadingP,
    loadingD,
    loadingW,
  } = cascade;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Số điện thoại *
        </label>
        <input
          className={inputCls}
          value={fields.phoneNumber}
          onChange={(e) => setField("phoneNumber", e.target.value)}
          placeholder="0901234567"
        />
      </div>

      <SelectField
        label="Tỉnh/Thành phố *"
        value={province}
        onChange={(v) => {
          setProvince(v);
          setField("province", v);
        }}
        loading={loadingP}
        placeholder="Chọn Tỉnh/Thành phố"
      >
        {provinces.map((p) => (
          <option key={p.code} value={p.name}>
            {p.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Quận/Huyện *"
        value={district}
        onChange={(v) => {
          setDistrict(v);
          setField("district", v);
        }}
        disabled={!province}
        loading={loadingD}
        placeholder="Chọn Quận/Huyện"
      >
        {districts.map((d) => (
          <option key={d.code} value={d.name}>
            {d.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Phường/Xã *"
        value={ward}
        onChange={(v) => {
          setWard(v);
          setField("ward", v);
        }}
        disabled={!district}
        loading={loadingW}
        placeholder="Chọn Phường/Xã"
      >
        {wards.map((w) => (
          <option key={w.code} value={w.name}>
            {w.name}
          </option>
        ))}
      </SelectField>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Địa chỉ cụ thể *
        </label>
        <input
          className={inputCls}
          value={fields.address}
          onChange={(e) => setField("address", e.target.value)}
          placeholder="Số nhà, tên đường (vd: 631 Nguyễn Huệ)"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={isPending}
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Đang lưu…" : submitLabel}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  );
}

// ── CreateAddressForm ──────────────────────────────────────────────────────

function CreateAddressForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<AddressFields>({
    phoneNumber: "",
    address: "",
    ward: "",
    district: "",
    province: "",
  });
  const cascade = useCascade();

  function setField(k: keyof AddressFields, v: string) {
    setFields((f) => ({ ...f, [k]: v }));
  }

  // sync cascade selections back to fields
  useEffect(() => setField("province", cascade.province), [cascade.province]);
  useEffect(() => setField("district", cascade.district), [cascade.district]);
  useEffect(() => setField("ward", cascade.ward), [cascade.ward]);

  function handleSubmit() {
    setError("");
    if (
      !fields.phoneNumber.trim() ||
      !fields.address.trim() ||
      !fields.province ||
      !fields.district ||
      !fields.ward
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    startTransition(async () => {
      try {
        await createAddress({
          phoneNumber: fields.phoneNumber.trim(),
          address: fields.address.trim(),
          ward: fields.ward ?? undefined,
          district: fields.district ?? undefined,
          province: fields.province ?? undefined,
        });
        setFields({
          phoneNumber: "",
          address: "",
          ward: "",
          district: "",
          province: "",
        });
        cascade.setProvince("");
        cascade.setDistrict("");
        cascade.setWard("");
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      }
    });
  }

  return (
    <AddressFormFields
      fields={fields}
      setField={setField}
      cascade={cascade}
      error={error}
      isPending={isPending}
      onSubmit={handleSubmit}
      submitLabel="Thêm địa chỉ"
    />
  );
}

// ── EditAddressForm ────────────────────────────────────────────────────────

function EditAddressForm({
  addressId,
  initial,
  onDone,
}: Omit<EditProps, "mode">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<AddressFields>({
    phoneNumber: initial.phoneNumber,
    address: initial.address,
    ward: initial.ward ?? "",
    district: initial.district ?? "",
    province: initial.province ?? "",
  });
  const cascade = useCascade(
    initial.province ?? "",
    initial.district ?? "",
    initial.ward ?? "",
  );

  function setField(k: keyof AddressFields, v: string) {
    setFields((f) => ({ ...f, [k]: v }));
  }

  useEffect(() => setField("province", cascade.province), [cascade.province]);
  useEffect(() => setField("district", cascade.district), [cascade.district]);
  useEffect(() => setField("ward", cascade.ward), [cascade.ward]);

  function handleSubmit() {
    setError("");
    if (
      !fields.phoneNumber.trim() ||
      !fields.address.trim() ||
      !fields.province ||
      !fields.district ||
      !fields.ward
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    startTransition(async () => {
      try {
        await updateAddressAction(addressId, {
          phoneNumber: fields.phoneNumber.trim(),
          address: fields.address.trim(),
          ward: fields.ward ?? undefined,
          district: fields.district ?? undefined,
          province: fields.province ?? undefined,
        });
        router.refresh();
        onDone();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      }
    });
  }

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3">
      <AddressFormFields
        fields={fields}
        setField={setField}
        cascade={cascade}
        error={error}
        isPending={isPending}
        onSubmit={handleSubmit}
        onCancel={onDone}
        submitLabel="Lưu"
      />
    </div>
  );
}

// ── AddressActions ─────────────────────────────────────────────────────────

function AddressActions({
  addressId,
  initial,
}: {
  addressId: string;
  initial: EditProps["initial"];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  function handleDelete() {
    setError("");
    startTransition(async () => {
      try {
        await deleteAddress(addressId);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Xóa thất bại.");
      }
    });
  }

  return (
    <>
      {/* Bút - góc trên phải */}
      <button
        onClick={() => setEditing((v) => !v)}
        className="absolute top-3 right-4 h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        title={editing ? "Đóng" : "Sửa địa chỉ"}
      >
        {editing ? (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
            />
          </svg>
        )}
      </button>

      {/* Thùng rác - góc dưới phải, ẩn khi đang edit */}
      {!editing && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="absolute bottom-3 right-4 h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          title="Xóa địa chỉ"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
            />
          </svg>
        </button>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {editing && (
        <EditAddressForm
          addressId={addressId}
          initial={initial}
          onDone={() => setEditing(false)}
        />
      )}
    </>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────

export default function AddressForm(props: Props) {
  if (props.mode === "create") return <CreateAddressForm />;
  if (props.mode === "edit")
    return (
      <EditAddressForm
        addressId={props.addressId}
        initial={props.initial}
        onDone={props.onDone}
      />
    );
  return <AddressActions addressId={props.addressId} initial={props.initial} />;
}
