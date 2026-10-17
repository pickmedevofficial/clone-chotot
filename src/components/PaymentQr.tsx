"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { buildVietQrUrl } from "@/lib/commerce";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types/shop";

const bank = {
  bank: process.env.NEXT_PUBLIC_BANK_ID ?? "",
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "",
  name: process.env.NEXT_PUBLIC_BANK_NAME ?? "",
};
export default function PaymentQr({ order }: { order: Order }) {
  const bankQr =
    order.payment === "bank"
      ? buildVietQrUrl(bank, order.totals.total, order.id)
      : null;
  const [demoQr, setDemoQr] = useState("");
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    if (bankQr) return;
    let active = true;
    import("qrcode")
      .then((mod) =>
        mod.toDataURL(
          `MEN DAILY - DEMO ORDER\n${order.id}\n${order.totals.total} VND\nNOT FOR PAYMENT`,
          {
            width: 300,
            margin: 2,
            errorCorrectionLevel: "M",
            color: { dark: "#102b58", light: "#ffffff" },
          },
        ),
      )
      .then((url) => {
        if (active) setDemoQr(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [bankQr, order.id, order.totals.total]);
  const src = bankQr ?? demoQr;
  return (
    <section className="panel text-center">
      <p className="eyebrow text-brand">
        {bankQr ? "BANK TRANSFER" : "ORDER REFERENCE"}
      </p>
      <h2 className="mt-2 text-lg font-bold">
        {bankQr ? "Quét QR để chuyển khoản" : "QR thông tin đơn hàng"}
      </h2>
      <p className="mt-2 text-xs leading-6 text-muted">
        {bankQr
          ? "Kiểm tra người nhận và số tiền trên ứng dụng ngân hàng trước khi xác nhận."
          : "Mã minh họa chứa mã đơn và tổng tiền, không dùng để thanh toán."}
      </p>
      <div className="mx-auto my-5 flex min-h-56 max-w-64 items-center justify-center overflow-hidden rounded-2xl border border-line bg-white p-2">
        {failed ? (
          <p role="alert" className="p-4 text-sm text-red-600">
            Không tải được QR. Vui lòng dùng thông tin bên dưới.
          </p>
        ) : src ? (
          <Image
            src={src}
            alt={
              bankQr
                ? `QR chuyển khoản ${order.id}`
                : `QR minh họa đơn ${order.id}, không dùng thanh toán`
            }
            width={300}
            height={300}
            unoptimized
            onError={() => setFailed(true)}
          />
        ) : (
          <p className="text-xs text-muted">Đang tạo mã QR…</p>
        )}
      </div>
      <p className="text-2xl font-extrabold text-price">
        {formatPrice(order.totals.total)}
      </p>
      {bankQr ? (
        <dl className="mt-5 space-y-3 text-left text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Ngân hàng</dt>
            <dd className="font-semibold">{bank.bank}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Số tài khoản</dt>
            <dd className="font-mono font-semibold">{bank.account}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Chủ tài khoản</dt>
            <dd className="text-right font-semibold">{bank.name}</dd>
          </div>
          <div className="border-t border-line pt-3">
            <dt className="text-muted">Nội dung chuyển khoản</dt>
            <dd className="mt-2 break-all font-mono font-semibold">
              {order.id}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-6 text-brand">
          {order.payment === "cod"
            ? "Đơn COD: thanh toán cho đơn vị vận chuyển khi nhận hàng."
            : "Chưa cấu hình tài khoản nhận tiền. Vui lòng không chuyển khoản theo mã minh họa."}
        </p>
      )}
      <button
        className="btn-secondary mt-4 w-full text-xs!"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(order.id);
            setCopied("Đã sao chép mã đơn");
          } catch {
            setCopied(
              "Không thể sao chép tự động. Bạn có thể chọn mã đơn ở trên.",
            );
          }
        }}
      >
        Sao chép mã đơn
      </button>
      <p role="status" className="mt-2 text-xs text-brand">
        {copied}
      </p>
    </section>
  );
}
