"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getCategoryName } from "@/data/categories";
import { formatDate, formatPrice } from "@/lib/format";
import { findProduct, useIsClient, useProducts } from "@/lib/product-store";
import type { Product } from "@/types/product";

const CONDITION_LABEL: Record<Product["condition"], string> = {
  moi: "Mới",
  "da-su-dung": "Đã sử dụng",
};

function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const images = product.images;
  const current = images[Math.min(index, images.length - 1)];

  if (!current)
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-background text-muted">
        Chưa có ảnh
      </div>
    );

  return (
    <div className="min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
        <Image
          src={current}
          alt={`${product.title} — ảnh ${index + 1}/${images.length}`}
          fill
          sizes="(min-width: 768px) 600px, 100vw"
          className="object-contain"
          priority
        />
      </div>
      {images.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Ảnh sản phẩm">
          {images.map((src, i) => (
            <li key={`${i}-${src.slice(0, 40)}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === index}
                className={`relative block h-16 w-20 overflow-hidden rounded-md ring-2 ${
                  i === index ? "ring-brand-strong" : "ring-transparent"
                }`}
              >
                <Image src={src} alt={`${product.title} — ảnh thu nhỏ ${i + 1}`} fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductDetail({ id }: { id: string }) {
  const products = useProducts();
  const isClient = useIsClient();
  const product = findProduct(products, id);

  if (!product) {
    // Trước khi hydrate chỉ có mock data; tin của người dùng chưa đọc được từ localStorage.
    if (!isClient) return <p className="py-16 text-center text-muted">Đang tải...</p>;
    return (
      <div className="rounded-lg bg-surface px-4 py-16 text-center">
        <h1 className="mb-3 text-xl font-semibold">Không tìm thấy tin đăng</h1>
        <p className="mb-6 text-muted">Tin có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <Link href="/" className="rounded-md bg-brand px-5 py-2.5 font-semibold hover:brightness-95">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <article className="grid gap-4 rounded-lg bg-surface p-4 md:grid-cols-[3fr_2fr] md:gap-6 md:p-6">
      <Gallery key={product.id} product={product} />
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:underline">Trang chủ</Link> / {getCategoryName(product.categoryId)}
        </nav>
        <h1 className="break-words text-xl font-semibold leading-snug sm:text-2xl">{product.title}</h1>
        <p className="mt-2 text-2xl font-bold text-price">{formatPrice(product.price)}</p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Tình trạng</dt>
          <dd>{CONDITION_LABEL[product.condition]}</dd>
          <dt className="text-muted">Danh mục</dt>
          <dd>{getCategoryName(product.categoryId)}</dd>
          <dt className="text-muted">Khu vực</dt>
          <dd>{product.location}</dd>
          <dt className="text-muted">Ngày đăng</dt>
          <dd>{formatDate(product.createdAt)}</dd>
        </dl>
        <h2 className="mt-6 mb-2 font-semibold">Mô tả chi tiết</h2>
        <p className="whitespace-pre-line break-words text-sm leading-relaxed">
          {product.description || "Người bán chưa thêm mô tả."}
        </p>
      </div>
    </article>
  );
}
