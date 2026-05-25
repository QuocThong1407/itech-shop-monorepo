import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f3f4f6] px-4 py-8">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/80">
            <div className="text-sm text-zinc-500">Loading login...</div>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
