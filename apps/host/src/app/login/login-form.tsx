"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getAppHomePath, getRoleFromPath, normalizeAuthRole } from "@itech/shared/auth";
import { Badge } from "@itech/shared";
import Logo from "@itech/shared/assets/logo.png";
import LoginImage from "@itech/shared/assets/LoginImage.png";

type LoginResponse = {
  success?: boolean;
  message?: string;
  data?: {
    user?: {
      id?: string;
      email?: string;
      username?: string;
      name?: string;
      role?: string;
    };
    accessToken?: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

function resolveRedirectPath(nextPath: string | null, role: string | null) {
  const normalizedRole = normalizeAuthRole(role);

  if (!normalizedRole) {
    return "/";
  }

  if (!nextPath || !nextPath.startsWith("/")) {
    return getAppHomePath(normalizedRole);
  }

  const targetRole = getRoleFromPath(nextPath);
  if (!targetRole || targetRole !== normalizedRole) {
    return getAppHomePath(normalizedRole);
  }

  return nextPath;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get("next");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as LoginResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Email or password is incorrect.");
      }

      const user = payload.data?.user;
      const role = normalizeAuthRole(user?.role);

      if (!role) {
        throw new Error("User role is missing from login response.");
      }

      const redirectPath = resolveRedirectPath(nextPath, role);
      router.replace(redirectPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_#fafafa_0%,_#f3f4f6_100%)] px-4 py-8 text-zinc-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur">
        <section className="hidden w-5/12 flex-col justify-between bg-[linear-gradient(160deg,_#0f172a_0%,_#1e293b_55%,_#334155_100%)] p-10 text-white lg:flex">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              ITech Shop Online
            </div>
            <div>
              <h1 className="max-w-md text-4xl font-semibold tracking-tight">
                Shop smarter, track orders faster, and stay signed in securely.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
                Sign in to access your cart, saved addresses, order history, and delivery updates
                from one unified storefront.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] max-w-[280px] mx-auto">
            <Image
              src={Logo}
              alt="ITech Shop Online"
              className="h-auto w-64 rounded-[1.25rem] object-cover shadow-[0_18px_50px_rgba(15,23,42,0.35)]"
              priority
            />
          </div>
        </section>

        <section className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-7/12">
          <div className="w-full max-w-lg">
            <div className="mb-8 lg:hidden">
              <Badge tone="success">Customer Storefront</Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Sign in to continue shopping with your ITech account.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-8 hidden lg:block">
                <Badge tone="success">Customer Storefront</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                  Sign in to continue shopping
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  Use your customer account to manage cart, orders, and delivery details.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in to continue"}
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link
                  className="font-medium text-zinc-600 transition hover:text-zinc-950 hover:underline"
                  href="/forgot-password"
                >
                  Forgot password?
                </Link>
                <div className="text-zinc-600">
                  New customer?{" "}
                  <Link
                    className="font-semibold text-zinc-950 transition hover:underline"
                    href="/register"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
