export default function CartLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="h-3 w-16 rounded-full bg-emerald-100 animate-pulse mb-2" />
          <div className="h-8 w-48 rounded-xl bg-zinc-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-[1.5rem] border border-zinc-200 bg-white/80 p-4 flex gap-4 animate-pulse"
              >
                <div className="h-20 w-20 rounded-xl bg-zinc-100 shrink-0" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-4 w-3/4 rounded-full bg-zinc-100" />
                  <div className="h-3 w-1/3 rounded-full bg-zinc-100" />
                  <div className="h-3 w-1/4 rounded-full bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white/90 p-6 flex flex-col gap-4 animate-pulse">
            <div className="h-5 w-32 rounded-full bg-zinc-100" />
            <div className="h-px bg-zinc-100" />
            <div className="h-6 w-full rounded-full bg-zinc-100" />
            <div className="h-10 w-full rounded-full bg-emerald-100" />
          </div>
        </div>
      </div>
    </main>
  );
}
