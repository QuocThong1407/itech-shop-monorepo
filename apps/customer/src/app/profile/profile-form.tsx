"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/lib/actions";

interface Props {
  initialUsername: string;
  initialEmail: string;
}

export default function ProfileForm({ initialUsername, initialEmail }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    setError("");
    setSuccess(false);

    const trimmed = username.trim();
    if (!trimmed) {
      setError("Tên đăng nhập không được để trống.");
      return;
    }
    if (trimmed === initialUsername) {
      setError("Bạn chưa thay đổi gì.");
      return;
    }

    startTransition(async () => {
      try {
        await updateProfileAction({ username: trimmed });
        setSuccess(true);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Cập nhật thất bại.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Email
        </label>
        <input
          type="email"
          value={initialEmail}
          disabled
          className="w-full rounded-xl border border-zinc-100 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-zinc-400">Email không thể thay đổi.</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Tên đăng nhập
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
          placeholder="Nhập tên đăng nhập"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-600">Cập nhật thành công!</p>
      )}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Đang lưu…" : "Lưu thay đổi"}
      </button>
    </div>
  );
}
