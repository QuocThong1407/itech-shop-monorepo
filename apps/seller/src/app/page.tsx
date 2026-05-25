import { Badge, LogoutButton } from "@itech/shared";

const hostLoginUrl = `${process.env.HOST_APP_URL ?? "http://localhost:3000"}/login`;

const panels = [
  {
    title: "Catalog control",
    description: "Products, variants, and pricing stay in one focused workspace.",
  },
  {
    title: "Order workflow",
    description: "Track sales, status changes, and post-purchase support.",
  },
  {
    title: "Returns & refunds",
    description: "Handle seller-side return actions without touching admin tools.",
  },
];

export default function SellerHomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,_#fafafa_0%,_#f8fafc_100%)] px-6 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-[2rem] border border-zinc-200 bg-white px-6 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:flex-row md:items-center">
          <div>
            <Badge tone="warning">Seller Workspace</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Operations dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Focused on product operations, order handling, and seller-specific workflows.
            </p>
          </div>
          <LogoutButton redirectTo={hostLoginUrl} />
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {panels.map((panel) => (
            <article
              key={panel.title}
              className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            >
              <h2 className="text-lg font-semibold">{panel.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{panel.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
