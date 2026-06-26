"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import Logo from "@itech/shared/assets/logo.png";

export default function VerifyEmailHandler() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    // Supabase redirect về đây với hash fragment chứa access_token
    // Nếu có token trong hash → verify thành công
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("access_token");
    const type = params.get("type");

    if (accessToken && type === "signup") {
      setStatus("success");
    } else if (accessToken && type === "recovery") {
      // Redirect qua reset-password với token
      window.location.href = `/reset-password#${hash.replace("#", "")}`;
    } else {
      setStatus("error");
    }
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_#fafafa_0%,_#f3f4f6_100%)] px-4 py-8 text-zinc-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center px-8 py-16 max-w-md">
          <Image src={Logo} alt="iTech" className="h-16 w-auto" priority />

          {status === "loading" && (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
              <p className="text-sm text-zinc-500">Đang xác nhận email...</p>
            </>
          )}

          {status === "success" && (
            <>
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
              <h2 className="text-2xl font-semibold text-zinc-900">
                Email đã xác nhận!
              </h2>
              <p className="text-sm text-zinc-500">
                Tài khoản của bạn đã được kích hoạt. Đăng nhập để bắt đầu mua
                sắm.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition"
              >
                Đăng nhập ngay
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <svg
                  className="h-8 w-8 text-rose-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900">
                Link không hợp lệ
              </h2>
              <p className="text-sm text-zinc-500">
                Link xác nhận đã hết hạn hoặc không hợp lệ. Vui lòng đăng ký
                lại.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition"
              >
                Đăng ký lại
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
