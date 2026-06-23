"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAddressAction as createAddress,
  deleteAddressAction as deleteAddress,
} from "@/lib/actions";

interface CreateProps {
  mode: "create";
}
interface ActionsProps {
  mode: "actions";
  addressId: string;
}
type Props = CreateProps | ActionsProps;

function CreateAddressForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState({
    phoneNumber: "",
    address: "",
    street: "",
    ward: "",
    district: "",
    province: "",
  });

  function update(key: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    setError("");
    if (!fields.phoneNumber.trim() || !fields.address.trim()) {
      setError("Số điện thoại và địa chỉ là bắt buộc.");
      return;
    }
    startTransition(async () => {
      try {
        await createAddress({
          phoneNumber: fields.phoneNumber.trim(),
          address: fields.address.trim(),
          street: fields.street.trim() || undefined,
          ward: fields.ward.trim() || undefined,
          district: fields.district.trim() || undefined,
          province: fields.province.trim() || undefined,
        });
        setFields({
          phoneNumber: "",
          address: "",
          street: "",
          ward: "",
          district: "",
          province: "",
        });
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      }
    });
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition";

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Số điện thoại *
        </label>
        <input
          className={inputCls}
          value={fields.phoneNumber}
          onChange={(e) => update("phoneNumber", e.target.value)}
          placeholder="0901234567"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Địa chỉ *
        </label>
        <input
          className={inputCls}
          value={fields.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="Số nhà, tên đường"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Đường/Phố
          </label>
          <input
            className={inputCls}
            value={fields.street}
            onChange={(e) => update("street", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Phường/Xã
          </label>
          <input
            className={inputCls}
            value={fields.ward}
            onChange={(e) => update("ward", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Quận/Huyện
          </label>
          <input
            className={inputCls}
            value={fields.district}
            onChange={(e) => update("district", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Tỉnh/Thành
          </label>
          <input
            className={inputCls}
            value={fields.province}
            onChange={(e) => update("province", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Đang lưu…" : "Thêm địa chỉ"}
      </button>
    </div>
  );
}

function AddressActions({ addressId }: { addressId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDelete() {
    setError("");
    startTransition(async () => {
      try {
        await deleteAddress(addressId);
        router.refresh();
      } catch (e: unknown) {
        // BE trả 400 + message rõ ràng nếu địa chỉ đã gắn order
        setError(e instanceof Error ? e.message : "Xóa thất bại.");
      }
    });
  }

  return (
    <div className="mt-3 flex items-center gap-2 flex-wrap">
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Đang xóa…" : "Xóa"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function AddressForm(props: Props) {
  if (props.mode === "create") return <CreateAddressForm />;
  return <AddressActions addressId={props.addressId} />;
}
