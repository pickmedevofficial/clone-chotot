"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { PROVINCES } from "@/data/categories";
import { useCart, useIsClient, submitOrder } from "@/lib/commerce-store";
import {
  calculateTotals,
  createOrder,
  resolveCart,
  validateBuyer,
} from "@/lib/commerce";
import { formatPrice } from "@/lib/format";
import type { Buyer, PaymentMethod, ShippingMethod } from "@/types/shop";
import { CheckoutSteps, Totals, VoucherPicker } from "./OrderSummary";
import { Icon } from "./Icons";

const EMPTY_BUYER: Buyer = {
  name: "",
  phone: "",
  email: "",
  province: "",
  district: "",
  ward: "",
  address: "",
  note: "",
};
const fields: {
  key: keyof Buyer;
  label: string;
  placeholder: string;
  autoComplete?: string;
  type?: string;
  required?: boolean;
  wide?: boolean;
}[] = [
  {
    key: "name",
    label: "Họ và tên",
    placeholder: "Nguyễn Văn Nam",
    autoComplete: "name",
    required: true,
  },
  {
    key: "phone",
    label: "Số điện thoại",
    placeholder: "09xx xxx xxx",
    autoComplete: "tel",
    type: "tel",
    required: true,
  },
  {
    key: "email",
    label: "Email (không bắt buộc)",
    placeholder: "nam@example.com",
    autoComplete: "email",
    type: "email",
    wide: true,
  },
  {
    key: "province",
    label: "Tỉnh / thành phố",
    placeholder: "Chọn hoặc nhập tỉnh / thành",
    autoComplete: "address-level1",
    required: true,
  },
  {
    key: "district",
    label: "Khu vực / quận / huyện",
    placeholder: "Khu vực nhận hàng",
    autoComplete: "address-level2",
    required: true,
  },
  {
    key: "ward",
    label: "Phường / xã",
    placeholder: "Nhập phường / xã",
    autoComplete: "address-level3",
    required: true,
  },
  {
    key: "address",
    label: "Số nhà, tên đường",
    placeholder: "12 Nguyễn Trãi, tòa A, tầng 3…",
    autoComplete: "street-address",
    required: true,
    wide: true,
  },
];

export default function CheckoutView() {
  const router = useRouter();
  const cart = useCart();
  const ready = useIsClient();
  const [buyer, setBuyer] = useState<Buyer>(EMPTY_BUYER);
  const [shipping, setShipping] = useState<ShippingMethod>("standard");
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [voucher, setVoucher] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const lock = useRef(false);
  const lines = resolveCart(cart);
  const totals = calculateTotals(
    lines.reduce((sum, l) => sum + l.lineTotal, 0),
    shipping,
    voucher,
  );
  const errors = submitted ? validateBuyer(buyer) : {};
  function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setSubmitted(true);
    setError("");
    if (Object.keys(validateBuyer(buyer)).length || !accepted) {
      setError(
        !accepted
          ? "Vui lòng xác nhận thông tin và điều kiện đặt hàng."
          : "Vui lòng kiểm tra các trường được đánh dấu.",
      );
      document.getElementById("checkout-error")?.focus();
      return;
    }
    try {
      lock.current = true;
      setPending(true);
      const order = createOrder(cart, buyer, shipping, payment, voucher);
      const result = submitOrder(order);
      if (!result.ok) throw new Error(result.error);
      router.push(
        `/don-hang/${order.id}${result.cartWarning ? "?cartWarning=1" : ""}`,
      );
    } catch (e) {
      lock.current = false;
      setPending(false);
      setError(
        e instanceof Error
          ? e.message
          : "Chưa thể tạo đơn hàng. Vui lòng thử lại.",
      );
    }
  }
  if (!ready)
    return (
      <p className="panel py-16 text-center text-muted">Đang tải thông tin…</p>
    );
  if (!lines.length && !pending)
    return (
      <div className="panel py-16 text-center">
        <h1 className="text-xl font-bold">Chưa có sản phẩm để đặt hàng</h1>
        <p className="my-4 text-sm text-muted">
          Chọn sản phẩm và thêm vào giỏ trước khi thanh toán.
        </p>
        <Link href="/" className="btn-primary">
          Đến cửa hàng
        </Link>
      </div>
    );
  return (
    <>
      <CheckoutSteps active={2} />
      <h1 className="mb-7 text-2xl font-bold sm:text-3xl">Hoàn tất đơn hàng</h1>
      <form
        onSubmit={placeOrder}
        noValidate
        className="grid items-start gap-6 lg:grid-cols-[1fr_390px]"
      >
        <div className="space-y-5">
          <section className="panel">
            <h2 className="mb-1 flex items-center gap-3 text-lg font-bold">
              <span className="text-brand">01.</span> Thông tin nhận hàng
            </h2>
            <p className="mb-6 text-xs leading-6 text-muted">
              Các trường có dấu * là bắt buộc. Nhập địa chỉ đầy đủ để giao hàng
              thuận tiện.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                  <label
                    htmlFor={`buyer-${f.key}`}
                    className="mb-2 block text-xs font-semibold"
                  >
                    {f.label}
                    {f.required && <span className="ml-1 text-brand">*</span>}
                  </label>
                  <input
                    id={`buyer-${f.key}`}
                    name={f.key}
                    type={f.type ?? "text"}
                    list={f.key === "province" ? "provinces" : undefined}
                    autoComplete={f.autoComplete}
                    value={buyer[f.key]}
                    required={f.required}
                    maxLength={f.key === "name" ? 100 : 250}
                    onChange={(e) =>
                      setBuyer((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    aria-invalid={!!errors[f.key]}
                    aria-describedby={
                      errors[f.key] ? `error-${f.key}` : undefined
                    }
                    className="field"
                  />
                  {errors[f.key] && (
                    <p
                      id={`error-${f.key}`}
                      className="mt-1 text-xs text-red-600"
                    >
                      {errors[f.key]}
                    </p>
                  )}
                </div>
              ))}
              <datalist id="provinces">
                {PROVINCES.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <div className="sm:col-span-2">
                <label
                  htmlFor="buyer-note"
                  className="mb-2 block text-xs font-semibold"
                >
                  Ghi chú giao hàng (không bắt buộc)
                </label>
                <textarea
                  id="buyer-note"
                  value={buyer.note}
                  onChange={(e) =>
                    setBuyer((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Ví dụ: gọi trước khi giao…"
                  maxLength={500}
                  rows={3}
                  className="field"
                />
              </div>
            </div>
          </section>
          <section className="panel">
            <h2 className="mb-5 text-lg font-bold">
              <span className="mr-3 text-brand">02.</span>Phương thức vận chuyển
            </h2>
            <fieldset className="space-y-3">
              <legend className="sr-only">Chọn cách giao hàng</legend>
              {[
                {
                  id: "standard" as const,
                  title: "Giao tiêu chuẩn",
                  detail: "Dự kiến 3–5 ngày · Miễn phí từ 499.000đ",
                  price: totals.subtotal >= 499000 ? 0 : 30000,
                },
                {
                  id: "express" as const,
                  title: "Giao nhanh",
                  detail: "Dự kiến 1–2 ngày · Tùy khu vực nhận hàng",
                  price: 50000,
                },
              ].map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${shipping === s.id ? "border-brand bg-blue-50/60" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={s.id}
                    checked={shipping === s.id}
                    onChange={() => setShipping(s.id)}
                    className="accent-brand"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {s.title}
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-muted">
                      {s.detail}
                    </span>
                  </span>
                  <span className="text-xs font-semibold">
                    {s.price ? formatPrice(s.price) : "Miễn phí"}
                  </span>
                </label>
              ))}
            </fieldset>
          </section>
          <section className="panel">
            <h2 className="mb-5 text-lg font-bold">
              <span className="mr-3 text-brand">03.</span>Phương thức thanh toán
            </h2>
            <fieldset className="space-y-3">
              <legend className="sr-only">Chọn cách thanh toán</legend>
              {[
                {
                  id: "cod" as const,
                  title: "Thanh toán khi nhận hàng (COD)",
                  detail: "Thanh toán tiền mặt cho đơn vị giao hàng.",
                },
                {
                  id: "bank" as const,
                  title: "Chuyển khoản ngân hàng / QR",
                  detail: "Mã QR và số tiền xuất hiện sau khi tạo đơn.",
                },
              ].map((p) => (
                <label
                  key={p.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 ${payment === p.id ? "border-brand bg-blue-50/60" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={p.id}
                    checked={payment === p.id}
                    onChange={() => setPayment(p.id)}
                    className="mt-1 accent-brand"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      {p.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {p.detail}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            {payment === "bank" &&
              !(
                process.env.NEXT_PUBLIC_BANK_ID &&
                process.env.NEXT_PUBLIC_BANK_ACCOUNT &&
                process.env.NEXT_PUBLIC_BANK_NAME
              ) && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-muted">
                  Shop chưa cấu hình tài khoản ngân hàng. Bản trải nghiệm sẽ
                  hiển thị QR thông tin đơn, chưa dùng để chuyển tiền.
                </p>
              )}
          </section>
          <Link
            href="/gio-hang"
            className="inline-block text-sm font-semibold text-brand"
          >
            ← Quay lại giỏ hàng
          </Link>
        </div>
        <aside className="panel lg:sticky lg:top-28">
          <h2 className="mb-4 text-lg font-bold">Đơn hàng của bạn</h2>
          <ul className="max-h-72 space-y-4 overflow-auto border-b border-line pb-5">
            {lines.map((l) => (
              <li
                key={l.productId}
                className="flex justify-between gap-4 text-xs"
              >
                <div>
                  <p className="line-clamp-2 font-medium">{l.product.title}</p>
                  <p className="mt-1 text-muted">Số lượng: {l.quantity}</p>
                </div>
                <p className="shrink-0 font-semibold text-price">
                  {formatPrice(l.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
          <VoucherPicker
            value={voucher}
            onChange={setVoucher}
            error={totals.voucherError}
          />
          <Totals totals={totals} />
          <label className="mt-5 flex items-start gap-3 text-xs leading-6 text-muted">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 accent-brand"
            />
            <span>
              Tôi đã kiểm tra thông tin nhận hàng và hiểu đây là đơn demo, chỉ
              lưu trên trình duyệt này.
            </span>
          </label>
          {error && (
            <p
              id="checkout-error"
              tabIndex={-1}
              role="alert"
              className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-6 text-red-700"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || !lines.length}
            className="btn-primary mt-5 w-full"
          >
            {pending ? "Đang tạo đơn…" : "Xác nhận đặt hàng"}
            {!pending && <Icon name="arrow" />}
          </button>
          <p className="mt-3 text-center text-[10px] leading-5 text-muted">
            Bạn sẽ được xem lại toàn bộ đơn và thông tin thanh toán.
          </p>
        </aside>
      </form>
    </>
  );
}
