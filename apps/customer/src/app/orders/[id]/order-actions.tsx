"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, RotateCcw } from "lucide-react";
import type { CancellationStatus, ReturnStatus } from "@/lib/order-types";

interface Props {
  orderId: string;
  status: string;
  // Nếu đã có cancellation/return đang active, truyền vào đây
  existingCancellation?: { id: string; status: CancellationStatus } | null;
  existingReturn?: { id: string; status: ReturnStatus } | null;
}

const CANCEL_REASONS = [
  "Tôi muốn cập nhật địa chỉ/số điện thoại nhận hàng",
  "Tôi muốn thêm/thay đổi mã giảm giá",
  "Tôi muốn thay đổi sản phẩm (kích thước, màu sắc, số lượng...)",
  "Thủ tục thanh toán rắc rối",
  "Tôi tìm thấy chỗ mua khác tốt hơn (rẻ hơn, uy tín hơn, giao nhanh hơn...)",
  "Tôi không có nhu cầu mua nữa",
  "Lý do khác",
];

const RETURN_REASONS = [
  "Sản phẩm bị lỗi, hư hỏng",
  "Sản phẩm không đúng mô tả",
  "Sản phẩm không đúng màu sắc/kích thước đã đặt",
  "Tôi đặt nhầm sản phẩm",
  "Lý do khác",
];

const CANCELLATION_STATUS_LABEL: Record<CancellationStatus, string> = {
  REQUESTED: "Chờ duyệt",
  APPROVED: "Đã duyệt, đang xử lý",
  REJECTED: "Đã từ chối",
  COMPLETED: "Đã hủy",
};

const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Chờ duyệt",
  APPROVED: "Đã duyệt, đang xử lý",
  REJECTED: "Đã từ chối",
  COMPLETED: "Đã hoàn hàng",
};

export default function OrderActions({
  orderId,
  status,
  existingCancellation: initialCancellation,
  existingReturn: initialReturn,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState<"cancel" | "return" | null>(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");

  // Track newly created request (sau khi submit thành công)
  const [newCancellation, setNewCancellation] = useState<{
    id: string;
    status: CancellationStatus;
  } | null>(null);
  const [newReturn, setNewReturn] = useState<{
    id: string;
    status: ReturnStatus;
  } | null>(null);

  // Effective state: ưu tiên newly created > initial từ server
  const activeCancellation = newCancellation ?? initialCancellation ?? null;
  const activeReturn = newReturn ?? initialReturn ?? null;

  const canCancel =
    ["PENDING", "CONFIRMED", "SHIPPED"].includes(status) && !activeCancellation;
  const canReturn = status === "DELIVERED" && !activeReturn;

  function reset() {
    setShowForm(null);
    setReason("");
    setCustomReason("");
    setError("");
  }

  async function handleSubmit() {
    const finalReason = reason === "Lý do khác" ? customReason.trim() : reason;
    if (!finalReason) {
      setError(
        reason === "Lý do khác"
          ? "Vui lòng nhập lý do."
          : "Vui lòng chọn lý do.",
      );
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const BASE =
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";
        const endpoint =
          showForm === "cancel"
            ? `${BASE}/orders/${orderId}/cancel/request`
            : `${BASE}/orders/${orderId}/return/request`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: finalReason }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra.");

        if (showForm === "cancel" && data?.data?.id) {
          setNewCancellation({ id: data.data.id, status: "REQUESTED" });
        } else if (showForm === "return" && data?.data?.id) {
          setNewReturn({ id: data.data.id, status: "REQUESTED" });
        }

        reset();
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      }
    });
  }

  const reasons = showForm === "cancel" ? CANCEL_REASONS : RETURN_REASONS;

  // Không có gì để render
  if (!canCancel && !canReturn && !activeCancellation && !activeReturn) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Banner: đang có yêu cầu hủy */}
      {activeCancellation && (
        <div className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              Yêu cầu hủy đơn:{" "}
              <span className="font-medium">
                {CANCELLATION_STATUS_LABEL[activeCancellation.status]}
              </span>
            </span>
          </div>
          <Link
            href={`/orders/cancellations/${activeCancellation.id}`}
            className="shrink-0 text-xs font-medium text-orange-600 transition hover:underline"
          >
            Xem chi tiết →
          </Link>
        </div>
      )}

      {/* Banner: đang có yêu cầu hoàn hàng */}
      {activeReturn && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>
              Yêu cầu hoàn hàng:{" "}
              <span className="font-medium">
                {RETURN_STATUS_LABEL[activeReturn.status]}
              </span>
            </span>
          </div>
          <Link
            href={`/orders/returns/${activeReturn.id}`}
            className="shrink-0 text-xs font-medium text-amber-600 transition hover:underline"
          >
            Xem chi tiết →
          </Link>
        </div>
      )}

      {/* Nút action — chỉ hiện khi chưa có request */}
      {!showForm && (canCancel || canReturn) && (
        <div className="flex justify-end gap-2">
          {canCancel && (
            <button
              onClick={() => setShowForm("cancel")}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
            >
              Yêu cầu hủy đơn
            </button>
          )}
          {canReturn && (
            <button
              onClick={() => setShowForm("return")}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
            >
              Yêu cầu hoàn hàng
            </button>
          )}
        </div>
      )}

      {/* Form chọn lý do */}
      {showForm && (
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur-sm space-y-4">
          <p className="text-sm font-semibold text-zinc-700">
            {showForm === "cancel" ? "Lý do hủy đơn" : "Lý do hoàn hàng"}
          </p>
          <div className="space-y-2">
            {reasons.map((r) => (
              <label
                key={r}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => {
                    setReason(r);
                    setCustomReason("");
                    setError("");
                  }}
                  className="mt-0.5 accent-emerald-500"
                />
                <span className="text-sm text-zinc-700 group-hover:text-zinc-900">
                  {r}
                </span>
              </label>
            ))}
          </div>
          {reason === "Lý do khác" && (
            <textarea
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition resize-none"
              rows={3}
              maxLength={500}
              placeholder="Nhập lý do..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={reset}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition"
            >
              {isPending ? "Đang gửi..." : "Xác nhận"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
