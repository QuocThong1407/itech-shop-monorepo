import { Suspense } from "react";
import PaymentResult from "./payment-result";

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f3f4f6] px-4 py-8">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/80">
            <div className="text-sm text-zinc-500">Đang xử lý...</div>
          </div>
        </main>
      }
    >
      <PaymentResult />
    </Suspense>
  );
}
