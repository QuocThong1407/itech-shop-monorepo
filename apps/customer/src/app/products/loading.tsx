// apps/customer/src/app/products/loading.tsx
export default function ProductsLoading() {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start animate-pulse">
      {/* Sidebar skeleton */}
      <aside className="w-full md:w-56 shrink-0 rounded-2xl border border-zinc-200 bg-white shadow-sm p-4 flex flex-col gap-6">
        <div>
          <div className="h-3 w-16 bg-zinc-100 rounded mb-3" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        </div>
        <div>
          <div className="h-3 w-16 bg-zinc-100 rounded mb-3" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        </div>
      </aside>

      {/* Grid skeleton */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col"
          >
            <div className="aspect-square bg-zinc-100" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
              <div className="h-4 bg-zinc-100 rounded w-1/2" />
              <div className="h-5 bg-zinc-100 rounded w-1/3 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
