import Link from "next/link";
import { PageIntro, StatusBadge } from "@itech/shared";
import type { SellerOperationalSnapshot } from "../types";
import { formatMoney } from "../helpers";

type SellerDashboardHeroProps = {
  snapshot: SellerOperationalSnapshot;
};

export default function SellerDashboardHero({ snapshot }: SellerDashboardHeroProps) {
  return (
    <PageIntro
      eyebrow="Seller command center"
      title="Run daily sales, fulfillment, and catalog health from one cockpit."
      description="This dashboard turns your seller workspace into a live operating view. Track secured revenue, move open orders faster, and catch stock or recovery issues before they slow down customers."
      className="bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      actions={
        <div className="flex gap-3 pt-5">
          <Link
            href="/orders"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:bg-amber-500"
          >
            Review orders
          </Link>
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-amber-200 hover:bg-amber-50"
          >
            Manage products
          </Link>
        </div>
      }
    />
  );
}
