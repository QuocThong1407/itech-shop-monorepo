import Link from "next/link";
import { getAddresses } from "@/lib/api";
import AddressForm from "./address-form";

function fullAddress(a: {
  address: string;
  street: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;
}) {
  return [a.address, a.street, a.ward, a.district, a.province]
    .filter(Boolean)
    .join(", ");
}

export default async function AddressesPage() {
  const addresses = await getAddresses();

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href="/customer/profile"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-emerald-600 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Quay lại hồ sơ
        </Link>

        <h1 className="text-xl font-semibold text-zinc-800 font-[Geist,sans-serif]">
          Địa chỉ của tôi
        </h1>

        {addresses.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white/60 p-10 text-center">
            <p className="text-sm text-zinc-400">Bạn chưa có địa chỉ nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-5"
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-zinc-800">
                    {addr.phoneNumber}
                  </span>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {fullAddress(addr)}
                  </p>
                </div>
                <AddressForm mode="actions" addressId={addr.id} />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-6">
          <h2 className="text-sm font-medium text-zinc-700 mb-4">
            Thêm địa chỉ mới
          </h2>
          <AddressForm mode="create" />
        </div>
      </div>
    </main>
  );
}
