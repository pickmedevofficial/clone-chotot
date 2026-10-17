"use client";
import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/lib/commerce-store";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/shop";
import ProductVisual from "./ProductVisual";
import { Icon } from "./Icons";
export default function ProductCard({ product }: { product: Product }) {
  const [message, setMessage] = useState("");
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5">
      <Link
        href={`/san-pham/${product.id}`}
        className="relative block overflow-hidden bg-[#eef2f7] p-3 sm:p-5"
        aria-label={product.title}
      >
        <span
          className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[9px] font-bold ${product.packSize > 1 ? "bg-blue-100 text-blue-700" : "bg-white/90 text-muted"}`}
        >
          {product.packSize > 1 ? `COMBO ${product.packSize}` : "MUA LẺ"}
        </span>
        <ProductVisual
          product={product}
          decorative
          className="mx-auto h-28 sm:h-44"
        />
        <span className="absolute bottom-2 right-3 text-[8px] text-slate-500">
          Ảnh minh họa
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <p className="mb-1 truncate text-[9px] font-bold tracking-wider text-brand sm:mb-2">
          {product.brand.toUpperCase()}
        </p>
        <Link
          href={`/san-pham/${product.id}`}
          className="line-clamp-2 min-h-8 text-xs font-medium leading-4 hover:text-brand sm:min-h-10 sm:text-sm sm:leading-5"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-[10px] text-muted sm:mt-2 sm:text-[11px]">
          {product.size}
          {product.packSize > 1
            ? ` × ${product.packSize} sản phẩm`
            : " · 1 sản phẩm"}
        </p>
        <p className="mt-2 text-base font-extrabold text-price sm:mt-3 sm:text-xl">
          {formatPrice(product.price)}
        </p>
        <button
          onClick={() => {
            const r = addToCart(product.id);
            setMessage(r.ok ? "Đã thêm vào giỏ" : r.error);
          }}
          className="mt-2 flex min-h-10 w-full items-center justify-center gap-1 rounded-lg bg-blue-50 py-2 text-[11px] font-semibold text-brand transition hover:bg-brand hover:text-white sm:mt-3 sm:gap-2 sm:py-2.5"
        >
          <Icon name="plus" width="15" height="15" /> Thêm vào giỏ
        </button>
        {message && (
          <p role="status" className="mt-1 text-[10px] leading-4 text-brand">
            {message}
          </p>
        )}
      </div>
    </article>
  );
}
