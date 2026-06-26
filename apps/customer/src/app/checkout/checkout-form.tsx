"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CartItem, Address } from "@/lib/api";

interface Props {
  cartItems: CartItem[];
  cartTotal: number;
  addresses: Address[];
  buyNowVariantId?: string;
}

interface CouponValidateResponse {
  discountAmount: number;
}

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
    if (data?.code && COUPON_ERROR_MESSAGES[data.code])
      return COUPON_ERROR_MESSAGES[data.code];
    if (typeof data?.message === "string") return data.message;
  } catch {}
  return fallback;
}

function addressFull(addr: Address) {
  return [addr.address, addr.street, addr.ward, addr.district, addr.province]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutForm({
  cartItems,
  cartTotal,
  addresses,
  buyNowVariantId,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

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
  interface AvailableCoupon {
    id: string;
    code: string;
    discountPercentage: number;
    discountAmount: number;
    promotionName: string;
    remainingUsage: number;
  }
  // Coupon
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>(
    [],
  );
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCouponList, setShowCouponList] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [validatedCoupon, setValidatedCoupon] = useState<string | null>(null);

  useEffect(() => {
    if (step === 2) {
      fetchAvailableCoupons();
    }
  }, [step]);

  async function fetchAvailableCoupons() {
    setCouponsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/coupons/available?orderAmount=${cartTotal}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableCoupons(data.data ?? data);
      }
    } catch {
    } finally {
      setCouponsLoading(false);
    }
  }

  function handleSelectCoupon(coupon: AvailableCoupon) {
    setCouponCode(coupon.code);
    setDiscount(coupon.discountAmount);
    setValidatedCoupon(coupon.code);
    setCouponError(null);
    setShowCouponList(false);
  }

  function handleRemoveCoupon() {
    setCouponCode("");
    setDiscount(0);
    setValidatedCoupon(null);
  }

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const total = Math.max(0, cartTotal - discount);

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

  function handleContinue() {
    if (selectedAddressId === "__new__") {
      const { phoneNumber, address, district, province } = newAddress;
      if (
        !phoneNumber.trim() ||
        !address.trim() ||
        !district.trim() ||
        !province.trim()
      ) {
        setSubmitError("Vui lòng điền đầy đủ thông tin địa chỉ giao hàng.");
        return;
      }
    }
    setSubmitError(null);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      let addressId = selectedAddressId;
      if (selectedAddressId === "__new__") {
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
        addressId = addrData.id ?? addrData.data?.id;
      }

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          paymentMethod,
          ...(buyNowVariantId && { buyNowVariantId }),
        }),
      });
      if (!res.ok) {
        setSubmitError(
          await parseErrorMessage(res, "Đặt hàng thất bại. Vui lòng thử lại."),
        );
        return;
      }

      const data = await res.json();
      const orderId = data?.id ?? data?.data?.id;

      if (!orderId) {
        setSubmitError("Đặt hàng thành công nhưng không lấy được mã đơn hàng.");
        return;
      }

      // If VNPay, create payment and redirect
      if (paymentMethod === "VNPAY") {
        const payRes = await fetch(`${API_BASE}/payments`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            method: "VNPAY",
            returnUrl: `http://localhost:5000/api/payments/vnpay/return`,
          }),
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          const paymentUrl = payData?.data?.paymentUrl ?? payData?.paymentUrl;
          if (paymentUrl) {
            window.location.href = paymentUrl;
            return;
          }
        }
      }

      router.push(`/${orderId}/confirmation`);
      router.refresh();
    } catch {
      setSubmitError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);

  return (
    <>
      <style>{`
        .cps-red { color: #e53935; }
        .cps-bg-red { background: #e53935; }
        .cps-bg-red:hover { background: #c62828; }
        .cps-border-red { border-color: #e53935; }
        .cps-step-active { color: #e53935; border-bottom: 2px solid #e53935; }
        .cps-step-inactive { color: #9ca3af; border-bottom: 2px solid #e5e7eb; }
        .cps-radio:checked { accent-color: #e53935; }
        .cps-input:focus { outline: none; border-color: #e53935; box-shadow: 0 0 0 2px rgba(229,57,53,0.1); }
        .cps-card { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
      `}</style>

      {/* Stepper */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 16,
          background: "#fff",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <button
          type="button"
          onClick={() => step === 2 && setStep(1)}
          style={{
            flex: 1,
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: step === 2 ? "pointer" : "default",
            background: "none",
            border: "none",
          }}
          className={step === 1 ? "cps-step-active" : "cps-step-inactive"}
        >
          1. THÔNG TIN
        </button>
        <button
          type="button"
          disabled
          style={{
            flex: 1,
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 600,
            background: "none",
            border: "none",
            cursor: "default",
          }}
          className={step === 2 ? "cps-step-active" : "cps-step-inactive"}
        >
          2. THANH TOÁN
        </button>
      </div>

      {/* ── STEP 1: Thông tin ── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Cart items preview */}
          <div className="cps-card" style={{ padding: 16 }}>
            {cartItems.map((item) => {
              const pv = item.ProductVariant;
              const unitPrice = pv.Product.price + pv.priceAdjustment;
              const img = pv.images?.[0] ?? pv.Product.images?.[0];
              const variantLabel = pv.variantAttributes
                ? Object.values(pv.variantAttributes).join(" | ")
                : null;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    paddingBottom: 12,
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  {img && (
                    <img
                      src={img}
                      alt={pv.Product.name}
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#111827",
                        lineHeight: 1.4,
                      }}
                    >
                      {pv.Product.name}
                    </div>
                    {variantLabel && (
                      <div
                        style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}
                      >
                        {variantLabel}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 4,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#6b7280" }}>
                        Số lượng: {item.quantity}
                      </span>
                      <span
                        style={{ fontSize: 14, fontWeight: 600 }}
                        className="cps-red"
                      >
                        {fmt(unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer info */}
          <div className="cps-card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 14,
              }}
              className="cps-red"
            >
              Thông tin nhận hàng
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    border: `1.5px solid ${selectedAddressId === addr.id ? "#e53935" : "#e5e7eb"}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    background:
                      selectedAddressId === addr.id ? "#fff5f5" : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name="addr"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="cps-radio"
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {addr.phoneNumber}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}
                    >
                      {addressFull(addr)}
                    </div>
                  </div>
                </label>
              ))}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: `1.5px solid ${selectedAddressId === "__new__" ? "#e53935" : "#e5e7eb"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  background:
                    selectedAddressId === "__new__" ? "#fff5f5" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="addr"
                  value="__new__"
                  checked={selectedAddressId === "__new__"}
                  onChange={() => setSelectedAddressId("__new__")}
                  className="cps-radio"
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}
                >
                  Giao hàng đến địa chỉ mới
                </span>
              </label>

              {selectedAddressId === "__new__" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    paddingTop: 4,
                  }}
                >
                  {[
                    { key: "phoneNumber", placeholder: "Số điện thoại *" },
                    { key: "address", placeholder: "Số nhà, tên đường *" },
                    { key: "street", placeholder: "Đường/Phố" },
                    { key: "ward", placeholder: "Phường/Xã" },
                    { key: "district", placeholder: "Quận/Huyện *" },
                    { key: "province", placeholder: "Tỉnh/Thành phố *" },
                  ].map(({ key, placeholder }) => (
                    <input
                      key={key}
                      type="text"
                      placeholder={placeholder}
                      value={newAddress[key as keyof typeof newAddress]}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, [key]: e.target.value })
                      }
                      className="cps-input"
                      style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 6,
                        color: "#111827",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quý khách có muốn xuất hóa đơn? (cosmetic only) */}
          <div
            className="cps-card"
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>
              Quý khách có muốn xuất hóa đơn công ty không?
            </span>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="invoice"
                defaultChecked
                style={{ accentColor: "#e53935" }}
              />{" "}
              Không
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="invoice"
                style={{ accentColor: "#e53935" }}
              />{" "}
              Có
            </label>
          </div>

          {submitError && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                fontSize: 13,
                color: "#dc2626",
              }}
            >
              {submitError}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Thanh toán ── */}
      {step === 2 && (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* Coupon — thay cái cũ bằng cái này */}
          <div className="cps-card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}
              className="cps-red"
            >
              Mã giảm giá
            </div>

            {validatedCoupon ? (
              /* Đã chọn coupon — hiện badge + nút xóa */
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: 6,
                }}
              >
                <div>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}
                  >
                    🎉 {validatedCoupon}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#16a34a", marginLeft: 8 }}
                  >
                    — Giảm {fmt(discount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{
                    fontSize: 12,
                    color: "#dc2626",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Bỏ chọn
                </button>
              </div>
            ) : (
              /* Chưa chọn — hiện nút mở danh sách */
              <>
                <button
                  type="button"
                  onClick={() => setShowCouponList((v) => !v)}
                  disabled={couponsLoading}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 13,
                    border: "1.5px dashed #e5e7eb",
                    borderRadius: 6,
                    background: "#fafafa",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#374151",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {couponsLoading
                      ? "Đang tải mã..."
                      : availableCoupons.length > 0
                        ? `Chọn mã giảm giá (${availableCoupons.length} mã)`
                        : "Không có mã giảm giá phù hợp"}
                  </span>
                  {!couponsLoading && availableCoupons.length > 0 && (
                    <span>{showCouponList ? "▲" : "▼"}</span>
                  )}
                </button>

                {showCouponList && availableCoupons.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {availableCoupons.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCoupon(c)}
                        style={{
                          padding: "10px 14px",
                          border: "1.5px solid #e5e7eb",
                          borderRadius: 6,
                          background: "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.borderColor = "#e53935")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = "#e5e7eb")
                        }
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {c.code}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              marginTop: 2,
                            }}
                          >
                            {c.promotionName} · Còn {c.remainingUsage} lượt
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            flexShrink: 0,
                            marginLeft: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#e53935",
                            }}
                          >
                            -{fmt(c.discountAmount)}
                          </div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            ({c.discountPercentage}%)
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Order summary */}
          <div className="cps-card" style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#6b7280",
                paddingBottom: 8,
              }}
            >
              <span>Số lượng sản phẩm</span>
              <span style={{ fontWeight: 600, color: "#111827" }}>
                {cartItems.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#6b7280",
                paddingBottom: 8,
              }}
            >
              <span>Tổng tiền hàng</span>
              <span style={{ fontWeight: 600, color: "#111827" }}>
                {fmt(cartTotal)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#6b7280",
                paddingBottom: 8,
              }}
            >
              <span>Phí vận chuyển</span>
              <span style={{ fontWeight: 600, color: "#111827" }}>
                Miễn phí
              </span>
            </div>
            {discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: "#6b7280" }}>Giảm giá trực tiếp</span>
                <span style={{ fontWeight: 600 }} className="cps-red">
                  - {fmt(discount)}
                </span>
              </div>
            )}
            <div
              style={{
                borderTop: "1px solid #f3f4f6",
                paddingTop: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                Tổng tiền
              </span>
              <span
                style={{ fontSize: 18, fontWeight: 700 }}
                className="cps-red"
              >
                {fmt(total)}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              Đã gồm VAT và được làm tròn
            </p>
          </div>

          {/* Payment method */}
          <div className="cps-card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 14,
              }}
              className="cps-red"
            >
              Thông tin thanh toán
            </div>
            {(["COD", "VNPAY"] as const).map((method) => (
              <label
                key={method}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  marginBottom: 8,
                  border: `1.5px solid ${paymentMethod === method ? "#e53935" : "#e5e7eb"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  background: paymentMethod === method ? "#fff5f5" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                  className="cps-radio"
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                  >
                    {method === "COD"
                      ? "Thanh toán khi nhận hàng (COD)"
                      : "Thanh toán qua VNPay"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {method === "COD"
                      ? "Trả tiền mặt khi nhận hàng"
                      : "Giảm thêm tới 1.000.000₫"}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Delivery info summary */}
          {selectedAddr && (
            <div className="cps-card" style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
                className="cps-red"
              >
                Thông tin nhận hàng
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: "6px 0",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#6b7280" }}>Khách hàng</span>
                <span style={{ color: "#111827", fontWeight: 500 }}>
                  {selectedAddr.phoneNumber}
                </span>
                <span style={{ color: "#6b7280" }}>Nhận hàng tại</span>
                <span style={{ color: "#111827" }}>
                  {addressFull(selectedAddr)}
                </span>
              </div>
            </div>
          )}

          {submitError && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                fontSize: 13,
                color: "#dc2626",
              }}
            >
              {submitError}
            </div>
          )}
        </form>
      )}

      {/* ── Sticky bottom bar ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          marginTop: 16,
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          padding: "12px 0 0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 14, color: "#374151" }}>
            Tổng tiền tạm tính:
          </span>
          <span style={{ fontSize: 18, fontWeight: 700 }} className="cps-red">
            {fmt(total)}
          </span>
        </div>

        {step === 1 ? (
          <button
            type="button"
            onClick={handleContinue}
            className="cps-bg-red"
            style={{
              width: "100%",
              padding: "13px 0",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.2s",
            }}
          >
            Tiếp tục
          </button>
        ) : (
          <button
            type="submit"
            form=""
            onClick={(e) => {
              e.preventDefault();
              const fakeE = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(fakeE);
            }}
            disabled={submitting}
            className="cps-bg-red"
            style={{
              width: "100%",
              padding: "13px 0",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              opacity: submitting ? 0.7 : 1,
              letterSpacing: "0.02em",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Đang đặt hàng..." : "Thanh toán"}
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "8px 0",
              fontSize: 13,
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            ← Quay lại thông tin
          </button>
        )}
      </div>
    </>
  );
}
