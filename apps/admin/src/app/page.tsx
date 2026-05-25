import { LogoutButton, Badge } from "@itech/shared";

const hostLoginUrl = `${process.env.HOST_APP_URL ?? "http://localhost:3000"}/login`;

const metrics = [
  { label: "Users", value: "1,284" },
  { label: "Orders", value: "342" },
  { label: "Alerts", value: "08" },
];

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.10),_transparent_25%),linear-gradient(180deg,_#fafafa_0%,_#f4f4f5_100%)] px-6 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-[2rem] border border-zinc-200 bg-white px-6 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:flex-row md:items-center">
          <div>
            <Badge tone="danger">Admin Console</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">System overview</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Manage users, audit activity, and keep the marketplace healthy.
            </p>
          </div>
          <LogoutButton redirectTo={hostLoginUrl} />
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            >
              <p className="text-sm text-zinc-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.75rem] border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Protected by route guard</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Only users with `ADMIN` role can stay on this workspace. Everyone else is redirected
              out before the page renders.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Shared package ready</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              This app already uses the monorepo shared layer so auth, API, and UI helpers can be
              reused across role apps.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
