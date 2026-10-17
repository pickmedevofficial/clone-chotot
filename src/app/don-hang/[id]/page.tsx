import { Suspense } from "react";
import type { Metadata } from "next";
import ShopShell from "@/components/ShopShell";
import OrderView from "@/components/OrderView";
export const metadata: Metadata = { title: "Chi tiết đơn hàng" };
export default function OrderPage({ params }: PageProps<"/don-hang/[id]">) {
  return (
    <ShopShell>
      <Suspense
        fallback={
          <p className="py-16 text-center text-muted">Đang tải đơn hàng…</p>
        }
      >
        {params.then(({ id }) => (
          <OrderView id={id} />
        ))}
      </Suspense>
    </ShopShell>
  );
}
