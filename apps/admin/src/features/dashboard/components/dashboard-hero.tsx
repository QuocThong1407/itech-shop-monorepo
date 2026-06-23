import { Badge } from "@itech/shared";

export default function DashboardHero() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
      <div className="px-6 py-6 xl:px-8 xl:py-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="neutral" className="bg-sky-50 text-[#008ECC] ring-sky-200">
            Admin dashboard
          </Badge>
          <span className="text-sm text-slate-500">
            Live data from users, orders, revenue, and membership services
          </span>
        </div>

        <div className="mt-4 max-w-3xl space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Real-time control over sales, inventory, and customer health.
          </h2>
          <p className="text-base leading-7 text-slate-600">
            This dashboard now reads from the backend directly, so the cards, orders, top
            customers, and revenue trend reflect actual project data instead of placeholders.
          </p>
        </div>
      </div>
    </section>
  );
}
