import type { Metadata } from "next";
import CheckoutView from "@/components/CheckoutView";
import ShopShell from "@/components/ShopShell";
export const metadata: Metadata = { title: "Đặt hàng" };
export default function CheckoutPage() {
  return (
    <ShopShell>
      <CheckoutView />
    </ShopShell>
  );
}
