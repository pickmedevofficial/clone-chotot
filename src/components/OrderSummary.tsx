"use client";
import { useState } from "react";
import { VOUCHERS } from "@/lib/commerce";
import { formatPrice } from "@/lib/format";
import type { OrderTotals } from "@/types/shop";
export function Totals({ totals }: { totals: OrderTotals }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Tạm tính</dt>
        <dd className="font-semibold text-price">
          {formatPrice(totals.subtotal)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Giảm giá sản phẩm</dt>
        <dd className="font-semibold text-emerald-700">
          −{formatPrice(totals.discount)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Phí vận chuyển</dt>
        <dd className="font-semibold text-price">
          {formatPrice(totals.shippingFee)}
        </dd>
      </div>
      {totals.shippingDiscount > 0 && (
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Giảm phí vận chuyển</dt>
          <dd className="font-semibold text-emerald-700">
            −{formatPrice(totals.shippingDiscount)}
          </dd>
        </div>
      )}
      <div className="flex justify-between gap-3 border-t border-line pt-4 text-lg font-bold">
        <dt>Tổng thanh toán</dt>
        <dd className="text-xl font-extrabold text-price">
          {formatPrice(totals.total)}
        </dd>
      </div>
    </dl>
  );
}
export function VoucherPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="my-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <label
        htmlFor="voucher"
        className="mb-3 block text-sm font-bold text-blue-800"
      >
        Mã ưu đãi
      </label>
      <div className="flex gap-2">
        <input
          id="voucher"
          className="field uppercase"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nhập mã voucher"
          maxLength={30}
        />
        <button
          type="button"
          onClick={() => onChange(draft.trim().toUpperCase())}
          className="btn-secondary shrink-0 text-brand"
        >
          Áp dụng
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {VOUCHERS.map((v) => (
          <button
            key={v.code}
            type="button"
            title={`${v.label} · ${v.detail}`}
            onClick={() => {
              setDraft(v.code);
              onChange(v.code);
            }}
            className={`rounded-lg border-2 border-dashed px-2.5 py-2 font-mono text-xs font-bold transition ${value === v.code ? "border-brand bg-brand text-white" : "border-blue-300 bg-white text-blue-700 hover:border-brand hover:bg-blue-100"}`}
          >
            {v.code}
          </button>
        ))}
      </div>
      {value && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <p
            role={error ? "alert" : "status"}
            className={error ? "text-red-600" : "text-brand"}
          >
            {error ?? `Đã áp dụng ${value}`}
          </p>
          <button
            type="button"
            className="shrink-0 text-muted underline"
            onClick={() => {
              setDraft("");
              onChange("");
            }}
          >
            Bỏ mã
          </button>
        </div>
      )}
      <details className="mt-3 text-[11px] text-muted">
        <summary>Điều kiện ưu đãi</summary>
        <ul className="mt-2 space-y-2">
          {VOUCHERS.map((v) => (
            <li key={v.code}>
              <strong>{v.code}</strong>: {v.label}. {v.detail}.
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Mỗi đơn dùng một mã. Ngưỡng tính trên tiền hàng trước giảm giá.
        </p>
      </details>
    </div>
  );
}
export function CheckoutSteps({ active }: { active: number }) {
  return (
    <ol
      className="mb-8 flex flex-wrap items-center gap-3 text-xs sm:gap-6"
      aria-label="Các bước mua hàng"
    >
      {["Giỏ hàng", "Thông tin & thanh toán", "Xác nhận đơn"].map(
        (label, i) => (
          <li
            key={label}
            aria-current={active === i + 1 ? "step" : undefined}
            className={`flex items-center gap-2 ${active === i + 1 ? "font-semibold text-brand" : "text-muted"}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${active === i + 1 ? "bg-brand text-white" : "bg-slate-200"}`}
            >
              {i + 1}
            </span>
            {label}
            {i < 2 && <span className="ml-1 text-slate-300 sm:ml-4">/</span>}
          </li>
        ),
      )}
    </ol>
  );
}
