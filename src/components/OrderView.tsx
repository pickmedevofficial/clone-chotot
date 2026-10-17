"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOrders, useIsClient } from "@/lib/commerce-store";
import { formatDate, formatPrice } from "@/lib/format";
import { CheckoutSteps, Totals } from "./OrderSummary";
import PaymentQr from "./PaymentQr";
import { Icon } from "./Icons";

export default function OrderView({ id }: { id: string }) {
  const orders = useOrders();
  const ready = useIsClient();
  const cartWarning = useSearchParams().get("cartWarning") === "1";
  const order = orders.find((o) => o.id === id);
  if (!ready)
    return (
      <p className="panel py-16 text-center text-muted">Đang tải đơn hàng…</p>
    );
  if (!order)
    return (
      <div className="panel py-16 text-center">
        <h1 className="text-xl font-bold">Không tìm thấy đơn hàng</h1>
        <p className="my-4 text-sm text-muted">
          Đơn chỉ được lưu trên trình duyệt đã dùng để đặt hàng. Dữ liệu có thể
          đã bị xóa.
        </p>
        <Link href="/don-hang" className="btn-primary">
          Xem đơn của bạn
        </Link>
      </div>
    );
  return (
    <>
      <CheckoutSteps active={3} />
      {cartWarning && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-brand"
        >
          Đơn đã được lưu nhưng chưa thể dọn giỏ hàng. Bạn có thể xóa các sản
          phẩm đã đặt trong giỏ để tránh đặt lại.
        </p>
      )}
      <div className="mb-7 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-full bg-brand p-3 text-white">
            <Icon name="check" />
          </span>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Đã tạo đơn hàng demo
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cảm ơn {order.buyer.name}. Đơn của bạn đã được lưu trên trình
              duyệt này.
            </p>
            <p className="mt-3 break-all font-mono text-xs font-bold text-brand">
              {order.id} · {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="panel">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Chi tiết đơn hàng</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-brand">
                {order.status === "awaiting-payment"
                  ? "Chờ thanh toán"
                  : "Chờ xác nhận · COD"}
              </span>
            </div>
            <ul className="mb-5 divide-y divide-line">
              {order.items.map((i) => (
                <li
                  key={i.productId}
                  className="flex justify-between gap-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-medium">{i.title}</p>
                    <p className="mt-2 text-xs text-muted">
                      {formatPrice(i.unitPrice)} × {i.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-price">
                    {formatPrice(i.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
            <Totals totals={order.totals} />
            {order.totals.voucher && (
              <p className="mt-4 text-xs text-brand">
                Voucher đã dùng: {order.totals.voucher}
              </p>
            )}
          </section>
          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">Thông tin nhận hàng</h2>
            <div className="grid gap-6 text-sm sm:grid-cols-2">
              <div>
                <p className="font-semibold">{order.buyer.name}</p>
                <p className="mt-2 text-muted">{order.buyer.phone}</p>
                {order.buyer.email && (
                  <p className="mt-1 break-all text-muted">
                    {order.buyer.email}
                  </p>
                )}
                <p className="mt-3 leading-7 text-muted">
                  {order.buyer.address}, {order.buyer.ward},{" "}
                  {order.buyer.district}, {order.buyer.province}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Vận chuyển</p>
                <p className="mt-1 font-medium">
                  {order.shipping === "express"
                    ? "Giao nhanh · dự kiến 1–2 ngày"
                    : "Giao tiêu chuẩn · dự kiến 3–5 ngày"}
                </p>
                <p className="mt-4 text-xs text-muted">Thanh toán</p>
                <p className="mt-1 font-medium">
                  {order.payment === "bank"
                    ? "Chuyển khoản ngân hàng"
                    : "Thanh toán khi nhận hàng"}
                </p>
                {order.buyer.note && (
                  <>
                    <p className="mt-4 text-xs text-muted">Ghi chú</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">
                      {order.buyer.note}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
          <div className="rounded-xl border border-line p-4 text-xs leading-6 text-muted">
            Đây là bản trải nghiệm, đơn chưa được gửi đến cửa hàng và chưa có
            kết nối xác nhận giao dịch ngân hàng. Xóa dữ liệu trình duyệt sẽ xóa
            lịch sử đơn.
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">
              Tiếp tục mua sắm <Icon name="arrow" />
            </Link>
            <Link href="/don-hang" className="btn-secondary">
              Xem lịch sử đơn
            </Link>
          </div>
        </div>
        <PaymentQr order={order} />
      </div>
    </>
  );
}
