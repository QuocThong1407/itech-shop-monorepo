"use client";

import { useState } from "react";
import AddressForm from "./address-form";
import { Plus } from "lucide-react";

export default function AddAddressToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-3 text-sm text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Thêm địa chỉ mới
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <AddressForm mode="create" />
        </div>
      )}
    </div>
  );
}
