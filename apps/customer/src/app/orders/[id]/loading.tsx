export default function OrderDetailLoading() {
  return (
    <main
      className="min-h-screen py-10 px-4"
      style={{
        background:
          "radial-gradient(ellipse at 60% 0%, #d1fae5 0%, #f0fdf4 40%, #f8fafc 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto animate-pulse">
        {/* Back link */}
        <div className="h-3 w-32 bg-zinc-100 rounded-full mb-6" />

        {/* Order header card */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-zinc-100 rounded-full" />
              <div className="h-6 w-32 bg-zinc-100 rounded-xl" />
              <div className="h-3 w-36 bg-zinc-100 rounded-full" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-5 w-24 bg-zinc-100 rounded-full" />
              <div className="h-6 w-28 bg-zinc-100 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Shipping address card */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm px-6 py-5 space-y-3">
          <div className="h-4 w-32 bg-zinc-100 rounded-full" />
          <div className="h-3 w-2/5 bg-zinc-100 rounded-full" />
          <div className="h-3 w-4/5 bg-zinc-100 rounded-full" />
        </div>

        {/* Timeline card */}
        <div className="mb-4 rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm px-6 py-5">
          <div className="h-4 w-36 bg-zinc-100 rounded-full mb-4" />
          <div className="flex flex-col gap-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 shrink-0" />
                  {i < 3 && <div className="mt-1 h-6 w-px bg-zinc-100" />}
                </div>
                <div className="pb-4 pt-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-zinc-100 rounded-full" />
                  <div className="h-2.5 w-24 bg-zinc-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items card */}
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm px-6 py-5">
          <div className="h-4 w-28 bg-zinc-100 rounded-full mb-4" />
          <div className="divide-y divide-zinc-100">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="h-14 w-14 rounded-xl bg-zinc-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 bg-zinc-100 rounded-full" />
                  <div className="h-2.5 w-1/3 bg-zinc-100 rounded-full" />
                </div>
                <div className="h-4 w-16 bg-zinc-100 rounded-full shrink-0" />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <div className="h-3.5 w-20 bg-zinc-100 rounded-full" />
            <div className="h-6 w-28 bg-zinc-100 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
