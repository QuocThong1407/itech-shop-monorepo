"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerProfileAction } from "@/lib/actions";
import type { CustomerProfile } from "@/lib/api";

interface Props {
  initial: CustomerProfile;
}

interface Fields {
  phone: string;
  gender: string;
  birthday: string;
}

export default function ProfileDetailForm({ initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fields, setFields] = useState<Fields>({
    phone: initial.phone ?? "",
    gender: initial.gender ?? "",
    birthday: initial.birthday ?? "",
  });

  function update(key: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setError("");
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateCustomerProfileAction({
          phone: fields.phone.trim() || undefined,
          gender: fields.gender || undefined,
          birthday: fields.birthday || undefined,
        });
        setSuccess(true);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Cập nhật thất bại.");
      }
    });
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            className={inputCls}
            value={fields.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="0901234567"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Ngày sinh
          </label>
          <input
            type="date"
            className={inputCls}
            value={fields.birthday}
            onChange={(e) => update("birthday", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Giới tính
        </label>
        <div className="flex gap-3">
          {["Nam", "Nữ", "Khác"].map((g) => (
            <label
              key={g}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm cursor-pointer transition ${
                fields.gender === g
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 font-medium"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <input
                type="radio"
                name="gender"
                value={g}
                checked={fields.gender === g}
                onChange={() => update("gender", g)}
                className="sr-only"
              />
              {g}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-600">Cập nhật thành công!</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Đang lưu…" : "Lưu thay đổi"}
      </button>
    </div>
  );
}
