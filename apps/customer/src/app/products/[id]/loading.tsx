// apps/customer/src/app/products/[id]/loading.tsx
export default function ProductDetailLoading() {
  return (
    <main
      className="min-h-screen py-10 px-4"
      style={{
        background:
          "radial-gradient(ellipse at 60% 0%, #d1fae5 0%, #f0fdf4 40%, #f8fafc 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-3 w-24 bg-zinc-100 rounded-full mb-6" />
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="aspect-square bg-zinc-100" />
            <div className="p-8 space-y-5">
              <div className="h-4 w-16 bg-zinc-100 rounded-full" />
              <div className="h-7 w-3/4 bg-zinc-100 rounded-xl" />
              <div className="h-4 w-24 bg-zinc-100 rounded-full" />
              <div className="h-9 w-32 bg-zinc-100 rounded-xl" />
              <div className="space-y-2 pt-4 border-t border-zinc-100">
                <div className="h-3 w-full bg-zinc-100 rounded-full" />
                <div className="h-3 w-5/6 bg-zinc-100 rounded-full" />
                <div className="h-3 w-4/6 bg-zinc-100 rounded-full" />
              </div>
              <div className="h-11 w-full bg-zinc-100 rounded-[1.25rem] mt-4" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
