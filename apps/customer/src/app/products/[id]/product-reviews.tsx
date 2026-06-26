"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  images?: string[];
  reviewDate: string;
  customer?: {
    user?: { username: string };
  };
}

interface ReviewData {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sz =
    size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${sz} ${i < Math.round(rating) ? "text-amber-400" : "text-zinc-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

function getInitials(name: string) {
  return name?.charAt(0)?.toUpperCase() ?? "?";
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    averageRating: number;
    ratingDistribution: Record<number, number>;
    total: number;
  } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<{
    totalPages: number;
    total: number;
  } | null>(null);

  // Fetch summary 1 lần duy nhất
  useEffect(() => {
    fetch(`${API_BASE}/reviews/product/${productId}?page=1&limit=1`)
      .then((r) => r.json())
      .then((body) => {
        const payload = body.data ?? body;
        setSummary({
          averageRating: payload.averageRating ?? 0,
          ratingDistribution: payload.ratingDistribution ?? {},
          total: payload.pagination?.total ?? 0,
        });
      })
      .catch(() => {});
  }, [productId]);

  // Fetch reviews khi filter/page thay đổi
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "5",
        ...(filterRating ? { rating: String(filterRating) } : {}),
      });
      const res = await fetch(
        `${API_BASE}/reviews/product/${productId}?${params}`,
      );
      if (!res.ok) throw new Error();
      const body = await res.json();
      const payload = body.data ?? body;
      setReviews(payload.reviews ?? []);
      setPagination(payload.pagination ?? null);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, page, filterRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Reset về page 1 khi đổi filter
  const handleFilter = (r: number | null) => {
    setFilterRating(r);
    setPage(1);
  };

  const totalReviews = summary?.total ?? 0;
  const avg = summary?.averageRating ?? 0;
  const dist = summary?.ratingDistribution ?? {};

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="review"
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
              onClick={() => setLightbox(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-bold text-zinc-900 mb-5 pb-3 border-b border-zinc-100">
          Đánh giá sản phẩm
        </h2>

        {/* Summary */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6 p-4 bg-zinc-50 rounded-xl">
          {/* Big number */}
          <div className="flex flex-col items-center justify-center min-w-[120px] gap-1">
            <span className="text-5xl font-extrabold text-zinc-900">
              {avg.toFixed(1)}
            </span>
            <Stars rating={avg} size="md" />
            <span className="text-xs text-zinc-400 mt-1">
              {totalReviews} đánh giá
            </span>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 flex flex-col gap-1.5 justify-center">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = dist[star] ?? 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <button
                  key={star}
                  onClick={() =>
                    handleFilter(filterRating === star ? null : star)
                  }
                  className={`flex items-center gap-2 group transition rounded px-1 py-0.5
                    ${filterRating === star ? "bg-amber-50" : "hover:bg-zinc-100"}`}
                >
                  <span className="text-xs font-medium text-zinc-500 w-3">
                    {star}
                  </span>
                  <svg
                    className="w-3 h-3 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1 bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 w-6 text-right">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => handleFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
              ${!filterRating ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
          >
            Tất cả
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => handleFilter(filterRating === star ? null : star)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1
                ${filterRating === star ? "bg-amber-500 text-white border-amber-500" : "bg-white text-zinc-600 border-zinc-200 hover:border-amber-300"}`}
            >
              {star}{" "}
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>

        {/* Review list */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-zinc-200 rounded w-1/4" />
                  <div className="h-3 bg-zinc-200 rounded w-1/3" />
                  <div className="h-3 bg-zinc-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !reviews.length ? (
          <div className="text-center py-10 text-zinc-400 text-sm">
            <svg
              className="w-10 h-10 mx-auto mb-2 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {filterRating
              ? `Chưa có đánh giá ${filterRating} sao`
              : "Chưa có đánh giá nào"}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {reviews.map((review) => {
              const username = review.customer?.user?.username ?? "Khách hàng";
              return (
                <div key={review.id} className="py-4 flex gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full ${avatarColor(username)} flex items-center justify-center text-white text-sm font-semibold shrink-0`}
                  >
                    {getInitials(username)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-zinc-800">
                        {username}
                      </span>
                      <span className="text-xs text-zinc-400 shrink-0">
                        {formatDate(review.reviewDate)}
                      </span>
                    </div>
                    <Stars rating={review.rating} size="sm" />

                    {review.comment && (
                      <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {/* Review images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {review.images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setLightbox(img)}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 hover:border-blue-400 transition"
                          >
                            <Image
                              src={img}
                              alt={`review img ${i + 1}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-zinc-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:border-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Trước
            </button>
            <span className="text-xs text-zinc-500">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:border-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
