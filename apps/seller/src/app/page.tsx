import Link from "next/link";
import { Badge } from "@itech/shared";

const shortcuts = [
  {
    title: "Orders",
    description: "Review incoming orders, update status, and keep fulfillment moving.",
    href: "/orders",
  },
  {
    title: "Products",
    description: "Monitor product availability, pricing, and catalog quality.",
    href: "/products",
  },
  {
    title: "Returns",
    description: "Handle customer return requests and operational exceptions.",
    href: "/returns",
  },
];

const activityCards = [
  { label: "Pending orders", value: "24", tone: "bg-amber-50 text-amber-700" },
  { label: "Shipped today", value: "18", tone: "bg-sky-50 text-sky-700" },
  { label: "Delivered", value: "129", tone: "bg-emerald-50 text-emerald-700" },
  { label: "At risk", value: "6", tone: "bg-rose-50 text-rose-700" },
];

export default function SellerHomePage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-amber-100 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.4fr_0.9fr] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <Badge tone="warning">Seller dashboard</Badge>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Stay on top of orders, fulfillment, and catalog health.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                This workspace keeps the seller side focused on operations. Use it to
                process orders faster, keep stock accurate, and follow up on returns
                without going through admin screens.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/orders"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(245,158,11,0.18)] transition hover:bg-amber-500"
              >
                Open Orders
              </Link>
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-amber-200 hover:bg-amber-50"
              >
                Review Products
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {activityCards.map((card) => (
              <article
                key={card.label}
                className={`rounded-[1.5rem] border border-slate-100 p-4 ${card.tone}`}
              >
                <p className="text-xs uppercase tracking-[0.2em] opacity-70">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {shortcuts.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
          >
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <Link
              href={item.href}
              className="mt-5 inline-flex text-sm font-semibold text-amber-600 transition hover:text-amber-500"
            >
              Go to {item.title.toLowerCase()} {"→"}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
