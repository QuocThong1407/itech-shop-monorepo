import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createApiClient } from "@itech/shared/api";
import CartItemControls from "./cart-item-controls";

// Xóa interface CartItem cũ, thay bằng:
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

interface Cart {
  items: CartItem[];
  totalPrice: number;
}

const vnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

async function getCart(): Promise<Cart> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) redirect("/login");

  const client = createApiClient({
    baseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api",
    token: accessToken,
  });

  try {
    return await client.get<Cart>("/cart/me");
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
  const total = cart.totalPrice ?? 0;
  const isEmpty = items.length === 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
            Mua sắm
          </p>
          <h1 className="font-[Geist] text-3xl font-bold text-zinc-900 tracking-tight">
            Giỏ hàng của bạn
          </h1>
        </div>

        {isEmpty ? (
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white/70 shadow-sm backdrop-blur-sm px-8 py-20 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-zinc-500 text-base">
              Giỏ hàng trống. Hãy thêm sản phẩm để bắt đầu!
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition-colors"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 flex flex-col gap-3">
              {items.map((item) => {
                const pv = item.ProductVariant;
                const unitPrice = pv.Product.price + pv.priceAdjustment;
                const imageUrl =
                  pv.images?.[0] ??
                  pv.Product.images?.[0] ??
                  "/placeholder.png";
                const variantLabel = pv.variantAttributes
                  ? Object.values(pv.variantAttributes).join(" / ")
                  : "";

                return (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm p-4 flex gap-4 items-start"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                      <Image
                        src={imageUrl}
                        alt={pv.Product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 text-sm leading-snug truncate">
                        {pv.Product.name}
                      </p>
                      {variantLabel && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {variantLabel}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 mt-1">
                        Đơn giá:{" "}
                        <span className="font-medium text-zinc-700">
                          {vnd(unitPrice)}
                        </span>
                      </p>
                      <div className="mt-3">
                        <CartItemControls
                          itemId={item.id}
                          quantity={item.quantity}
                          max={pv.quantity}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-700">
                        {vnd(unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky top-6">
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white/90 shadow-sm backdrop-blur-sm p-6 flex flex-col gap-4">
                <h2 className="text-base font-bold text-zinc-900 font-[Geist]">
                  Tóm tắt đơn hàng
                </h2>

                <div className="flex flex-col gap-2 text-sm text-zinc-600">
                  {items.map((item) => {
                    const pv = item.ProductVariant;
                    const unitPrice = pv.Product.price + pv.priceAdjustment;
                    return (
                      <div key={item.id} className="flex justify-between gap-2">
                        <span className="truncate max-w-[60%] text-zinc-500">
                          {pv.Product.name}{" "}
                          <span className="text-zinc-400">
                            ×{item.quantity}
                          </span>
                        </span>
                        <span className="shrink-0 font-medium text-zinc-700">
                          {vnd(unitPrice * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-700">
                    Tổng cộng
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {vnd(total)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-1 w-full rounded-full bg-emerald-500 py-3 text-center text-sm font-bold text-white shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all"
                >
                  Tiến hành thanh toán →
                </Link>

                <Link
                  href="/products"
                  className="text-center text-xs text-zinc-400 hover:text-emerald-600 transition-colors"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
