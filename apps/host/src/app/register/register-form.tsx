"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Badge } from "@itech/shared";
import Logo from "@itech/shared/assets/logo.png";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "Đăng ký thất bại.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_#fafafa_0%,_#f3f4f6_100%)] px-4 py-8 text-zinc-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur">
        {/* Left panel */}
        <section className="hidden w-5/12 flex-col justify-between bg-[linear-gradient(160deg,_#0f172a_0%,_#1e293b_55%,_#334155_100%)] p-10 text-white lg:flex">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              ITech Shop Online
            </div>
            <div>
              <h1 className="max-w-md text-4xl font-semibold tracking-tight">
                Tham gia ITech Shop và mua sắm thông minh hơn.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
                Tạo tài khoản để theo dõi đơn hàng, lưu địa chỉ và nhận ưu đãi
                độc quyền.
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] max-w-[280px] mx-auto">
            <Image
              src={Logo}
              alt="ITech Shop"
              className="h-auto w-64 rounded-[1.25rem] object-cover shadow-[0_18px_50px_rgba(15,23,42,0.35)]"
              priority
            />
          </div>
        </section>

        {/* Right panel */}
        <section className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-7/12">
          <div className="w-full max-w-lg">
            <div className="rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-8">
                <Badge tone="success">Khách hàng mới</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                  Tạo tài khoản
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  Đăng ký để bắt đầu mua sắm tại ITech Shop.
                </p>
              </div>

              {success ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <svg
                      className="h-8 w-8 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900">
                    Đăng ký thành công!
                  </h3>
                  <p className="max-w-sm text-sm text-zinc-500">
                    Vui lòng kiểm tra email <strong>{email}</strong> và click
                    link xác nhận để kích hoạt tài khoản.
                  </p>
                  <Link
                    href="/login"
                    className="mt-2 inline-flex items-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition"
                  >
                    Về trang đăng nhập
                  </Link>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Tên người dùng
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                      placeholder="Tối thiểu 8 ký tự"
                      minLength={8}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-zinc-900 focus:bg-white"
                      placeholder="Nhập lại mật khẩu"
                      required
                    />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
                  </button>

                  <p className="text-center text-sm text-zinc-600">
                    Đã có tài khoản?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-zinc-950 hover:underline transition"
                    >
                      Đăng nhập
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
