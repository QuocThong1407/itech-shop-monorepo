import Link from "next/link";
import { LogoutButton } from "@itech/shared";
import { getProfile } from "@/lib/api";
import ProfileForm from "./profile-form";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        {/* Header card */}
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-8 flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-2xl font-semibold tracking-wide shadow">
            {getInitials(user.username)}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-zinc-800 font-[Geist,sans-serif]">
              {user.username}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>
          </div>
          <LogoutButton />
        </div>

        {/* Edit form */}
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-6">
          <h2 className="text-sm font-medium text-zinc-700 mb-4">
            Chỉnh sửa thông tin
          </h2>
          <ProfileForm initialUsername={user.username} />
        </div>

        {/* Link to addresses */}
        <Link
          href="/customer/profile/addresses"
          className="flex items-center justify-between rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm px-6 py-4 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group"
        >
          <div>
            <p className="text-sm font-medium text-zinc-800">Địa chỉ của tôi</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Quản lý địa chỉ giao hàng
            </p>
          </div>
          <svg
            className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500 transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </main>
  );
}
