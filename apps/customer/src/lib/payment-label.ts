// src/lib/payment-label.ts

export function getPaymentLabel(payment?: {
  method: string;
  status: string;
} | null): string {
  if (!payment) return "—";

  if (payment.method === "COD") {
    return "Thanh toán khi nhận hàng (COD)";
  }

  if (payment.method === "VNPAY") {
    if (payment.status === "SUCCESS") return "Đã thanh toán qua VNPay ✓";
    return "Chưa thanh toán (VNPay bị gián đoạn)";
  }

  if (payment.method === "STRIPE") {
    if (payment.status === "SUCCESS") return "Đã thanh toán qua Stripe ✓";
    return "Chưa thanh toán (Stripe bị gián đoạn)";
  }

  return payment.method;
}

export function getPaymentColor(payment?: {
  method: string;
  status: string;
} | null): string {
  if (!payment) return "#6b7280";
  if (payment.method === "COD") return "#6b7280";
  if (payment.status === "SUCCESS") return "#16a34a";
  return "#d97706"; // amber — chưa thanh toán
}