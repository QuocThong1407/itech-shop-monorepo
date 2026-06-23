import { redirect } from "next/navigation";
import { getCart, getAddresses } from "@/lib/api";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [cart, addresses] = await Promise.all([getCart(), getAddresses()]);

  if (!cart?.items?.length) redirect("/customer/cart");

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_40%,_#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 font-[Geist] text-2xl font-semibold tracking-tight text-zinc-800">
          Xác nhận đơn hàng
        </h1>
        <CheckoutForm
          cartItems={cart.items}
          cartTotal={cart.totalPrice}
          addresses={addresses}
        />
      </div>
    </main>
  );
}
