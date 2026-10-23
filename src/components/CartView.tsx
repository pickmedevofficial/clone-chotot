"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart, useIsClient, updateQuantity } from "@/lib/commerce-store";
import { calculateTotals, resolveCart } from "@/lib/commerce";
import { formatPrice } from "@/lib/format";
import ProductVisual from "./ProductVisual";
import QuantityControl from "./QuantityControl";
import { CheckoutSteps, Totals } from "./OrderSummary";
import { Icon } from "./Icons";

export default function CartView() {
  const cart = useCart();
  const ready = useIsClient();
  const [error, setError] = useState("");
  const lines = resolveCart(cart);
  const totals = calculateTotals(
    lines.reduce((sum, l) => sum + l.lineTotal, 0),
    "standard",
    "",
  );
  function update(id: string, n: number) {
    const result = updateQuantity(id, n);
    setError(result.ok ? "" : result.error);
  }
  return (
    <>
      <CheckoutSteps active={1} />
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Giỏ hàng của bạn
          <span className="ml-3 text-base font-normal text-muted">
            ({cart.reduce((s, i) => s + i.quantity, 0)})
          </span>
        </h1>
        <Link href="/" className="text-xs font-semibold text-brand">
          ← Tiếp tục mua sắm
        </Link>
      </div>
      {!ready ? (
        <p className="panel py-16 text-center text-muted">Đang tải giỏ hàng…</p>
      ) : !lines.length ? (
        <div className="panel py-20 text-center">
          <Icon
            name="bag"
            width="48"
            height="48"
            className="mx-auto mb-5 text-blue-300"
          />
          <h2 className="text-xl font-bold">Giỏ hàng đang chờ bạn</h2>
          <p className="mb-7 mt-3 text-sm text-muted">
            Thêm vài món thiết yếu cho routine mỗi ngày.
          </p>
          <Link href="/#san-pham" className="btn-primary">
            Khám phá sản phẩm <Icon name="arrow" />
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_370px]">
          <section
            aria-label="Sản phẩm trong giỏ"
            className="overflow-hidden rounded-2xl border border-line bg-white"
          >
            <div className="hidden grid-cols-[1fr_120px_140px] gap-3 border-b border-line bg-slate-50 px-5 py-4 text-xs text-muted sm:grid">
              <span>Sản phẩm</span>
              <span className="text-center">Số lượng</span>
              <span className="text-right">Thành tiền</span>
            </div>
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li
                  key={line.productId}
                  className="grid grid-cols-[auto_1fr] items-center gap-4 p-4 sm:grid-cols-[1fr_120px_140px] sm:p-5"
                >
                  <div className="col-span-2 flex min-w-0 items-center gap-4 sm:col-span-1">
                    <Link
                      href={`/san-pham/${line.productId}`}
                      className="shrink-0 rounded-xl bg-background p-2"
                    >
                      <ProductVisual
                        product={line.product}
                        decorative
                        className="h-24 w-20"
                      />
                    </Link>
                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] font-bold tracking-wide text-brand">
                        {line.product.brand}
                      </p>
                      <Link
                        href={`/san-pham/${line.productId}`}
                        className="line-clamp-2 text-sm font-semibold hover:text-brand"
                      >
                        {line.product.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        {line.product.size} ·{" "}
                        {line.product.packSize === 1
                          ? "Mua lẻ"
                          : `Combo ${line.product.packSize}`}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-price">
                        {formatPrice(line.product.price)} / đơn vị
                      </p>
                      <button
                        onClick={() => update(line.productId, 0)}
                        className="mt-2 text-[11px] text-muted underline hover:text-red-600"
                        aria-label={`Xóa ${line.product.title}`}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-start sm:justify-center">
                    <QuantityControl
                      quantity={line.quantity}
                      onChange={(n) => update(line.productId, n)}
                      label={`Số lượng ${line.product.title}`}
                    />
                  </div>
                  <p className="text-right text-sm font-bold text-price">
                    {formatPrice(line.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <aside className="panel lg:sticky lg:top-28">
            <h2 className="mb-5 text-lg font-bold">Tóm tắt giỏ hàng</h2>
            <Totals totals={totals} />
            <p className="mt-4 text-xs leading-6 text-muted">
              Tạm tính giao tiêu chuẩn. Chọn giao hàng, phương thức thanh toán
              và voucher ở bước tiếp theo.
            </p>
            {totals.subtotal < 499000 && (
              <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-brand">
                Thêm {formatPrice(499000 - totals.subtotal)} để được miễn phí
                giao tiêu chuẩn.
              </p>
            )}
            <Link href="/thanh-toan" className="btn-primary mt-5 w-full">
              Tiến hành đặt hàng <Icon name="arrow" />
            </Link>
            <p className="mt-3 text-center text-[10px] text-muted">
              Giỏ hàng được lưu trên trình duyệt này
            </p>
          </aside>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </>
  );
}
