// apps/customer/src/app/cart/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createApiClient } from "@itech/shared/api";
import CartClient from "./cart-client";

interface ProductVariant {
  id: string;
  quantity: number;
  variantAttributes: Record<string, string> | null;
  images: string[] | null;
  priceAdjustment: number;
  Product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stockQuantity: number;
  };
}

interface CartItem {
  id: string;
  quantity: number;
  ProductVariant: ProductVariant;
}

// Response thật từ backend: { success, message, data: { id, items, totalPrice, ... } }
interface CartApiResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    items: CartItem[];
    totalPrice: number;
  };
}

async function getCart() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) redirect("/login");

  const client = createApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api",
    token: accessToken,
  });

  try {
    // client.get trả nguyên response { success, message, data }, cần lấy .data
    const res = await client.get<CartApiResponse>("/cart/me");
    return res.data;
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "";
    if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
      redirect("/login");
    }
    throw new Error("Không thể tải giỏ hàng");
  }
}

export default async function CartPage() {
  const cart = await getCart();
  const items = cart.items ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">
          Giỏ hàng của bạn
        </h1>
        <CartClient items={items} serverTotal={cart.totalPrice} />
      </div>
    </main>
  );
}
