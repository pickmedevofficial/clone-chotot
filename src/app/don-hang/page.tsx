import type { Metadata } from "next";
import ShopShell from "@/components/ShopShell";
import OrdersView from "@/components/OrdersView";
export const metadata: Metadata = { title: "Đơn hàng" };
export default function OrdersPage() {
  return (
    <ShopShell>
      <OrdersView />
    </ShopShell>
  );
}
