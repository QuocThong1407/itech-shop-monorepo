export default function OrdersLoading() {
  return (
    <main
      className="min-h-screen py-10 px-4"
      style={{
        background:
          "radial-gradient(ellipse at 60% 0%, #d1fae5 0%, #f0fdf4 40%, #f8fafc 100%)",
      }}
    >
      <div className="max-w-3xl mx-auto animate-pulse">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-zinc-100" />
          <div>
            <div className="h-7 w-44 bg-zinc-100 rounded-xl mb-2" />
            <div className="h-3 w-28 bg-zinc-100 rounded-full" />
          </div>
        </div>

        {/* Order rows */}
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm px-6 py-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-24 bg-zinc-100 rounded-full" />
                    <div className="h-5 w-20 bg-zinc-100 rounded-full" />
                  </div>
                  <div className="h-3 w-32 bg-zinc-100 rounded-full" />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2.5">
                  <div className="h-5 w-24 bg-zinc-100 rounded-full" />
                  <div className="h-7 w-28 bg-zinc-100 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
