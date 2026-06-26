import { Suspense } from "react";
import ForgotPasswordForm from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f3f4f6] px-4 py-8">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/80">
            <div className="text-sm text-zinc-500">Loading...</div>
          </div>
        </main>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
