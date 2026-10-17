import type { Metadata } from "next";
import CartView from "@/components/CartView";
import ShopShell from "@/components/ShopShell";
export const metadata: Metadata = { title: "Giỏ hàng" };
export default function CartPage() {
  return (
    <ShopShell>
      <CartView />
    </ShopShell>
  );
}
