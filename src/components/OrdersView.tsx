"use client";
import Link from "next/link";
import { useOrders, useIsClient } from "@/lib/commerce-store";
import { formatDate, formatPrice } from "@/lib/format";
export default function OrdersView() {
  const orders = useOrders();
  const ready = useIsClient();
  return (
    <>
      <h1 className="text-2xl font-bold sm:text-3xl">Đơn hàng của bạn</h1>
      <p className="mb-7 mt-3 text-sm text-muted">
        Lịch sử đặt hàng được lưu trên trình duyệt này.
      </p>
      {!ready ? (
        <p className="panel">Đang tải…</p>
      ) : !orders.length ? (
        <div className="panel py-16 text-center">
          <h2 className="text-lg font-bold">Bạn chưa có đơn hàng nào</h2>
          <Link href="/" className="btn-primary mt-5">
            Bắt đầu mua sắm
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/don-hang/${o.id}`}
                className="panel flex flex-wrap items-center justify-between gap-5 transition hover:border-blue-300"
              >
                <div>
                  <p className="break-all font-mono text-xs font-bold text-brand">
                    {o.id}
                  </p>
                  <p className="mt-2 line-clamp-1 text-sm font-semibold">
                    {o.items[0].title}
                    {o.items.length > 1 &&
                      ` + ${o.items.length - 1} sản phẩm khác`}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDate(o.createdAt)} ·{" "}
                    {o.status === "awaiting-payment"
                      ? "Chờ thanh toán"
                      : "Chờ xác nhận · COD"}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-bold text-price">
                    {formatPrice(o.totals.total)}
                  </p>
                  <p className="mt-2 text-xs text-brand">Xem đơn & QR ↗</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
