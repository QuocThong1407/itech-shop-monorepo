import { LogoutButton } from "@itech/shared";
import {
  getProfile,
  getAddresses,
  getMembership,
  getCustomerProfile,
} from "@/lib/api";
import ProfileForm from "./profile-form";
import AddressForm from "./addresses/address-form";
import Link from "next/link";
import ProfileDetailForm from "./profile-detail-form";
import AddAddressToggle from "./addresses/add-address-toggle";

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

const TIER_META: Record<
  string,
  { label: string; color: string; bg: string; ring: string; emoji: string }
> = {
  BRONZE: {
    label: "Đồng",
    color: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-300",
    emoji: "🥉",
  },
  SILVER: {
    label: "Bạc",
    color: "text-zinc-500",
    bg: "bg-zinc-50",
    ring: "ring-zinc-300",
    emoji: "🥈",
  },
  GOLD: {
    label: "Vàng",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    ring: "ring-yellow-300",
    emoji: "🥇",
  },
  PLATINUM: {
    label: "Bạch Kim",
    color: "text-sky-600",
    bg: "bg-sky-50",
    ring: "ring-sky-300",
    emoji: "💎",
  },
};

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── tabs ─────────────────────────────────────────────────────────────────────

type Tab = "info" | "addresses" | "membership";

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "Thông tin" },
  { id: "addresses", label: "Địa chỉ" },
  { id: "membership", label: "Hạng thành viên" },
];

// ── page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const activeTab: Tab =
    tabParam === "addresses" || tabParam === "membership" ? tabParam : "info";

  // Fetch in parallel, membership may not exist for non-customer user
  const [user, addresses, membership, customerProfile] = await Promise.all([
    getProfile(),
    activeTab === "addresses" ? getAddresses() : Promise.resolve([]),
    activeTab === "membership"
      ? getMembership().catch(() => null)
      : Promise.resolve(null),
    activeTab === "info" ? getCustomerProfile() : Promise.resolve(null),
  ]);

  const tier = membership
    ? (TIER_META[membership.tierInfo.current] ?? TIER_META.BRONZE)
    : null;

  const BENEFIT_LABEL: Record<string, string> = {
    DiscountPercentage: "Giảm giá",
    FreeShipping: "Miễn phí vận chuyển",
    PrioritySupport: "Hỗ trợ ưu tiên",
    EarlyAccess: "Truy cập sớm",
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* ── Header card ─────────────────────────────────────────────── */}
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm px-6 py-6 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-xl font-semibold shadow">
            {getInitials(user.username)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-geist text-lg font-semibold text-zinc-900 truncate">
              {user.username}
            </p>
            <p className="text-sm text-zinc-500 truncate">{user.email}</p>
            {membership && tier && (
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tier.bg} ${tier.color} ${tier.ring}`}
              >
                {tier.emoji} {tier.label}
              </span>
            )}
          </div>
          <LogoutButton />
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div className="flex rounded-2xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-1 gap-1">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={t.id === "info" ? "/profile" : `/profile?tab=${t.id}`}
              className={`flex-1 rounded-xl py-2 text-center text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* ── Tab: Thông tin ──────────────────────────────────────────── */}
        {activeTab === "info" && customerProfile && (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-6">
              <h2 className="text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wide">
                Tài khoản
              </h2>
              <ProfileForm
                initialUsername={user.username}
                initialEmail={user.email}
              />
            </div>

            <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-6">
              <h2 className="text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wide">
                Thông tin cá nhân
              </h2>
              <ProfileDetailForm initial={customerProfile} />
            </div>
          </div>
        )}

        {/* ── Tab: Địa chỉ ────────────────────────────────────────────── */}
        {activeTab === "addresses" && (
          <div className="space-y-3">
            {addresses.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white/60 py-12 text-center">
                <p className="text-sm text-zinc-400">
                  Bạn chưa có địa chỉ nào.
                </p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="relative rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm px-5 py-6"
                >
                  <p className="text-sm font-medium text-zinc-800">
                    {addr.phoneNumber}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    {fullAddress(addr)}
                  </p>
                  <AddressForm
                    mode="actions"
                    addressId={addr.id}
                    initial={{
                      phoneNumber: addr.phoneNumber,
                      address: addr.address,
                      street: addr.street,
                      ward: addr.ward,
                      district: addr.district,
                      province: addr.province,
                    }}
                  />
                </div>
              ))
            )}

            {/* Thêm địa chỉ mới */}
            <AddAddressToggle />
          </div>
        )}

        {/* ── Tab: Hạng thành viên ────────────────────────────────────── */}
        {activeTab === "membership" && (
          <div className="space-y-4">
            {!membership || !tier ? (
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm py-12 text-center text-sm text-zinc-400">
                Không tìm thấy thông tin hạng thành viên.
              </div>
            ) : (
              <>
                {/* Current tier card */}
                <div
                  className={`rounded-[1.5rem] border bg-white/80 shadow-sm backdrop-blur-sm p-6 ring-1 ${tier.ring}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{tier.emoji}</span>
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wide">
                        Hạng hiện tại
                      </p>
                      <p className={`text-xl font-semibold ${tier.color}`}>
                        {tier.label}
                      </p>
                    </div>
                  </div>

                  {/* Spent */}
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-zinc-500">Tổng chi tiêu</span>
                    <span className="font-semibold text-zinc-800">
                      {fmt(membership.spent)}
                    </span>
                  </div>

                  {/* Progress to next tier */}
                  {membership.tierInfo.nextTier ? (
                    <>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                        <span>
                          Tiến độ lên hạng {membership.tierInfo.nextTier}
                        </span>
                        <span>
                          {fmt(membership.tierInfo.spentToNextTier)} còn lại
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                        {(() => {
                          // tính % dựa trên khoảng từ tier hiện tại đến tier tiếp theo
                          // backend trả spentToNextTier = nextTier.min - spent
                          // → pct = spent / nextTier.min * 100 (approximate)
                          const nextMin =
                            membership.spent +
                            membership.tierInfo.spentToNextTier;
                          const pct =
                            nextMin > 0
                              ? Math.min(
                                  100,
                                  (membership.spent / nextMin) * 100,
                                )
                              : 0;
                          return (
                            <div
                              className={`h-full rounded-full transition-all ${tier.color.replace("text-", "bg-")}`}
                              style={{ width: `${pct}%` }}
                            />
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      🎉 Bạn đang ở hạng cao nhất!
                    </p>
                  )}
                </div>

                {/* Benefits */}
                {membership.tierInfo.benefits &&
                  Object.keys(membership.tierInfo.benefits).length > 0 && (
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-6">
                      <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">
                        Quyền lợi hạng {tier.label}
                      </h2>
                      <ul className="space-y-2">
                        {Object.entries(membership.tierInfo.benefits).map(
                          ([k, v]) => (
                            <li
                              key={k}
                              className="flex items-start gap-2 text-sm text-zinc-700"
                            >
                              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </span>
                              <span>
                                {BENEFIT_LABEL[k] ?? k}
                                {typeof v === "boolean"
                                  ? ""
                                  : `: ${v}${k === "DiscountPercentage" ? "%" : ""}`}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
