import { Badge, LogoutButton } from "@itech/shared";

const hostLoginUrl = `${process.env.HOST_APP_URL ?? "http://localhost:3000"}/login`;

const categories = ["Fast delivery", "Top deals", "Fresh arrivals", "Recommended"];

export default function CustomerHomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-4 py-6 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-zinc-200 bg-white/90 px-6 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <Badge tone="success">Customer Storefront</Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Personalized shopping, rendered on the server
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                This workspace is guarded on the server, so refreshes stay safe and fast.
              </p>
            </div>
            <LogoutButton redirectTo={hostLoginUrl} />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          {categories.map((item, index) => (
            <article
              key={item}
              className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Category {index + 1}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{item}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Flexible slot for product modules, promotion blocks, or curated carousels.
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
