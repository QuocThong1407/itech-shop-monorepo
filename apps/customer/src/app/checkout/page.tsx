import { redirect } from "next/navigation";
import { getCart, getAddresses } from "@/lib/api";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ buyNow?: string; variantId?: string; qty?: string }>; // 👈 Promise
}) {
  const params = await searchParams; // 👈 await trước khi dùng
  const [cart, addresses] = await Promise.all([getCart(), getAddresses()]);

  if (!cart?.items?.length) redirect("/customer/cart");

  const isBuyNow = params.buyNow === "true" && params.variantId; // 👈 dùng params

  const filteredItems = isBuyNow
    ? cart.items.filter(
        (item: any) => item.ProductVariant?.id === params.variantId,
      )
    : cart.items;

  const qty = isBuyNow ? Number(params.qty ?? 1) : null;

  const checkoutItems = isBuyNow
    ? filteredItems.map((item: any) => ({ ...item, quantity: qty }))
    : filteredItems;

  const checkoutTotal = checkoutItems.reduce((sum: number, item: any) => {
    const unitPrice =
      item.ProductVariant.Product.price + item.ProductVariant.priceAdjustment;
    return sum + unitPrice * item.quantity;
  }, 0);

  if (!checkoutItems.length) redirect("/customer/cart");

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 font-[Geist] text-2xl font-semibold tracking-tight text-zinc-800">
          Xác nhận đơn hàng
        </h1>
        <CheckoutForm
          cartItems={checkoutItems}
          cartTotal={checkoutTotal}
          addresses={addresses}
          buyNowVariantId={isBuyNow ? params.variantId : undefined}
        />
      </div>
    </main>
  );
}
