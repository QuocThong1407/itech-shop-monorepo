// apps\customer\src\app\api\orders\route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

// Proxy GET /api/orders → backend /orders, tự đính kèm accessToken từ httpOnly cookie.
// Dùng cho client component (OrdersList) khi bấm "Xem thêm" — client JS không đọc
// được httpOnly cookie nên không thể gọi thẳng backend.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  const res = await fetch(`${BASE_URL}/orders/me${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}