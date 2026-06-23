"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CartItem, Address } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  cartItems: CartItem[];
  cartTotal: number;
  addresses: Address[];
}

interface CouponValidateResponse {
  discountAmount: number;
}

interface CreateOrderResponse {
  orderId: string;
}

// ─── Constants / helpers ───────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

const COUPON_ERROR_MESSAGES: Record<string, string> = {
  COUPON_NOT_FOUND: "Mã giảm giá không tồn tại.",
  COUPON_EXPIRED: "Mã giảm giá đã hết hạn.",
  COUPON_USAGE_LIMIT: "Mã giảm giá đã hết lượt sử dụng.",
  COUPON_MIN_ORDER: "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã.",
};

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

async function parseErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = await res.json();
    if (data?.code && COUPON_ERROR_MESSAGES[data.code]) {
      return COUPON_ERROR_MESSAGES[data.code];
    }
    if (typeof data?.message === "string") return data.message;
  } catch {
    // body không phải JSON — dùng fallback
  }
  return fallback;
}

function addressLabel(addr: Address) {
  return addr.phoneNumber;
}

function addressFull(addr: Address) {
  return [addr.address, addr.street, addr.ward, addr.district, addr.province]
    .filter(Boolean)
    .join(", ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutForm({
  cartItems,
  cartTotal,
  addresses,
}: Props) {
  const router = useRouter();

  // Address
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses[0]?.id ?? "__new__",
  );
  const [newAddress, setNewAddress] = useState({
    phoneNumber: "",
    address: "",
    street: "",
    ward: "",
    district: "",
    province: "",
  });

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [validatedCoupon, setValidatedCoupon] = useState<string | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Derived ────────────────────────────────────────────────────────────────

  const total = Math.max(0, cartTotal - discount);

  // ─── Coupon ─────────────────────────────────────────────────────────────────

  async function handleValidateCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setDiscount(0);
    setValidatedCoupon(null);

    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderTotal: cartTotal,
        }),
      });

      if (!res.ok) {
        setCouponError(
          await parseErrorMessage(res, "Mã giảm giá không hợp lệ."),
        );
        return;
      }

      const data: CouponValidateResponse = await res.json();
      setDiscount(data.discountAmount ?? 0);
      setValidatedCoupon(couponCode.trim());
    } catch {
      setCouponError("Không thể kiểm tra mã. Vui lòng thử lại.");
    } finally {
      setCouponLoading(false);
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      let addressId = selectedAddressId;

      // Nếu user nhập địa chỉ mới → tạo trước, lấy id
      if (selectedAddressId === "__new__") {
        const { phoneNumber, address, district, province } = newAddress;
        if (
          !phoneNumber.trim() ||
          !address.trim() ||
          !district.trim() ||
          !province.trim()
        ) {
          setSubmitError("Vui lòng điền đầy đủ thông tin địa chỉ giao hàng.");
          setSubmitting(false);
          return;
        }

        const addrRes = await fetch(`${API_BASE}/addresses`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAddress),
        });

        if (!addrRes.ok) {
          setSubmitError(
            await parseErrorMessage(addrRes, "Không thể lưu địa chỉ."),
          );
          return;
        }

        const addrData = await addrRes.json();
        addressId = addrData.id; // hoặc addrData.data?.id tuỳ response shape của BE
      }

      // Đặt hàng với addressId đã có
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          // paymentMethod: "COD", // thêm nếu cần
        }),
      });

      if (!res.ok) {
        setSubmitError(
          await parseErrorMessage(res, "Đặt hàng thất bại. Vui lòng thử lại."),
        );
        return;
      }

      const data = await res.json();
      // BE trả về order object trực tiếp (từ orderService.createOrder → getOrderById)
      // nên id nằm ở data.id hoặc data.data?.id
      const orderId = data?.id ?? data?.data?.id;

      if (!orderId) {
        setSubmitError("Đặt hàng thành công nhưng không lấy được mã đơn hàng.");
        return;
      }

      router.push(`/customer/orders/${orderId}`);
      router.refresh();
    } catch {
      setSubmitError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── UI ──────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset disabled={submitting} className="contents">
        {/* 1. Địa chỉ giao hàng */}
        <section className="rounded-[1.5rem] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Địa chỉ giao hàng
          </h2>

          <div className="flex flex-col gap-3">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  selectedAddressId === addr.id
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-zinc-200 hover:border-emerald-200"
                }`}
              >
                <input
                  type="radio"
                  name="addressId"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-800">
                    {addressLabel(addr)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {addressFull(addr)}
                  </span>
                </span>
              </label>
            ))}

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                selectedAddressId === "__new__"
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-zinc-200 hover:border-emerald-200"
              }`}
            >
              <input
                type="radio"
                name="addressId"
                value="__new__"
                checked={selectedAddressId === "__new__"}
                onChange={() => setSelectedAddressId("__new__")}
                className="mt-0.5 accent-emerald-500"
              />
              <span className="text-sm font-medium text-zinc-800">
                Địa chỉ mới
              </span>
            </label>

            {selectedAddressId === "__new__" && (
              <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={newAddress.phoneNumber}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <input
                  type="text"
                  placeholder="Số nhà, tên đường"
                  value={newAddress.address}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, address: e.target.value })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <input
                  type="text"
                  placeholder="Đường/Phố"
                  value={newAddress.street}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, street: e.target.value })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <input
                  type="text"
                  placeholder="Phường/Xã"
                  value={newAddress.ward}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, ward: e.target.value })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <input
                  type="text"
                  placeholder="Quận/Huyện"
                  value={newAddress.district}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, district: e.target.value })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <input
                  type="text"
                  placeholder="Tỉnh/Thành phố"
                  value={newAddress.province}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, province: e.target.value })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            )}
          </div>
        </section>

        {/* 2. Mã giảm giá */}
        <section className="rounded-[1.5rem] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Mã giảm giá
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã coupon..."
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                if (validatedCoupon) {
                  setValidatedCoupon(null);
                  setDiscount(0);
                }
                setCouponError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleValidateCoupon();
                }
              }}
              className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="button"
              onClick={handleValidateCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {couponLoading ? "Đang kiểm tra..." : "Áp dụng"}
            </button>
          </div>

          {couponError && (
            <p className="mt-2 text-xs text-red-500">{couponError}</p>
          )}
          {validatedCoupon && discount > 0 && (
            <p className="mt-2 text-xs text-emerald-600">
              ✓ Mã <span className="font-semibold">{validatedCoupon}</span> hợp
              lệ — giảm {fmt(discount)}
            </p>
          )}
        </section>

        {/* 3. Tóm tắt đơn hàng */}
        <section className="rounded-[1.5rem] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Tóm tắt đơn hàng
          </h2>

          <ul className="flex flex-col gap-3">
            {cartItems.map((item) => {
              const pv = item.ProductVariant;
              const unitPrice = pv.Product.price + pv.priceAdjustment;
              const imageUrl = pv.images?.[0] ?? pv.Product.images?.[0];
              const variantLabel = pv.variantAttributes
                ? Object.values(pv.variantAttributes).join(" / ")
                : null;

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={pv.Product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <span className="text-sm text-zinc-700">
                      {pv.Product.name}
                      {variantLabel && (
                        <span className="text-zinc-400"> ({variantLabel})</span>
                      )}{" "}
                      <span className="text-zinc-400">× {item.quantity}</span>
                    </span>
                  </div>
                  <span className="text-sm font-medium text-zinc-800">
                    {fmt(unitPrice * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-zinc-100 pt-4">
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Tạm tính</span>
              <span>{fmt(cartTotal)}</span>
            </div>

            {discount > 0 && (
              <div className="mt-1 flex justify-between text-sm text-emerald-600">
                <span>Giảm giá</span>
                <span>− {fmt(discount)}</span>
              </div>
            )}

            <div className="mt-3 flex justify-between text-base font-semibold text-zinc-800">
              <span>Tổng cộng</span>
              <span className="text-emerald-600">{fmt(total)}</span>
            </div>
          </div>
        </section>
      </fieldset>

      {submitError && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[1.5rem] bg-emerald-500 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 active:scale-[0.99] disabled:opacity-60"
      >
        {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
      </button>
    </form>
  );
}
