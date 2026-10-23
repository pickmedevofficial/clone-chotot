"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRODUCTS, PRODUCT_MAP } from "@/data/products";
import { getCategoryName } from "@/data/categories";
import { addToCart } from "@/lib/commerce-store";
import { formatPrice } from "@/lib/format";
import ProductVisual from "./ProductVisual";
import ProductCard from "./ProductCard";
import QuantityControl from "./QuantityControl";
import { Icon } from "./Icons";

export default function ProductDetail({ id }: { id: string }) {
  const product = PRODUCT_MAP.get(id);
  return product ? (
    <Detail key={id} id={id} />
  ) : (
    <div className="panel my-10 py-16 text-center">
      <h1 className="text-xl font-bold">Không tìm thấy sản phẩm</h1>
      <p className="my-4 text-sm text-muted">
        Sản phẩm này không còn trong danh mục.
      </p>
      <Link className="btn-primary" href="/">
        Khám phá cửa hàng
      </Link>
    </div>
  );
}
function Detail({ id }: { id: string }) {
  const product = PRODUCT_MAP.get(id)!;
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const siblings = PRODUCTS.filter((p) => p.familyId === product.familyId);
  const related = PRODUCTS.filter(
    (p) =>
      p.categoryId === product.categoryId &&
      p.packSize === 1 &&
      p.familyId !== product.familyId,
  ).slice(0, 5);
  function add(buyNow: boolean) {
    const result = addToCart(id, quantity);
    setMessage(result.ok ? "Đã thêm sản phẩm vào giỏ hàng." : result.error);
    if (result.ok && buyNow) router.push("/gio-hang");
  }
  return (
    <>
      <nav
        className="mb-6 mt-2 flex flex-wrap gap-2 text-xs text-muted"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-brand">
          Trang chủ
        </Link>
        <span>/</span>
        <Link
          href={`/?q=${encodeURIComponent(getCategoryName(product.categoryId))}#san-pham`}
        >
          {getCategoryName(product.categoryId)}
        </Link>
        <span>/</span>
        <span>{product.brand}</span>
      </nav>
      <article className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-line bg-[#eaf0f8]">
          <div className="absolute h-2/3 w-2/3 rounded-full bg-white/60" />
          <ProductVisual product={product} className="relative h-4/5 w-4/5" />
          <span className="absolute bottom-5 text-[11px] text-muted">
            Bao bì minh họa · Không phải ảnh chính thức của hãng
          </span>
        </div>
        <div className="py-2">
          <p className="eyebrow mb-4 text-brand">{product.brand}</p>
          <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {getCategoryName(product.categoryId)}{" "}
            <span className="mx-2">/</span> {product.size}
          </p>
          <div className="mt-6 border-y border-line py-5">
            <p className="text-3xl font-extrabold text-price">
              {formatPrice(product.price)}
            </p>
            <p className="mt-2 text-xs text-muted">
              Giá tham khảo{" "}
              {product.packSize > 1 &&
                `· ${formatPrice(product.unitPrice)} / sản phẩm`}
            </p>
          </div>
          <div className="mt-6">
            <h2 className="text-sm font-semibold">Quy cách mua</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {siblings.map((p) => (
                <Link
                  key={p.id}
                  href={`/san-pham/${p.id}`}
                  aria-current={p.id === id ? "page" : undefined}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium ${p.id === id ? "border-brand bg-blue-50 text-brand" : "border-line bg-white hover:border-brand"}`}
                >
                  {p.packSize === 1 ? "Mua lẻ" : `Combo ${p.packSize}`}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-5">
            <span className="text-sm font-semibold">Số lượng</span>
            <QuantityControl quantity={quantity} onChange={setQuantity} />
            <span className="text-xs text-muted">Tối đa 20</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              className="btn-secondary border-blue-200! text-brand"
              onClick={() => add(false)}
            >
              <Icon name="cart" />
              Thêm vào giỏ
            </button>
            <button className="btn-primary" onClick={() => add(true)}>
              Đặt hàng <Icon name="arrow" />
            </button>
          </div>
          <p role="status" className="mt-3 min-h-6 text-sm text-brand">
            {message}
          </p>
          <div className="mt-2 space-y-3 rounded-2xl bg-white p-5 text-xs text-muted">
            <p className="flex items-center gap-3">
              <Icon name="truck" className="text-brand" /> Giao tiêu chuẩn miễn
              phí từ 499.000đ
            </p>
            <p className="flex items-center gap-3">
              <Icon name="bag" className="text-brand" /> Nhập HELLO10: giảm 10%
              từ 200.000đ, tối đa 100.000đ
            </p>
          </div>
        </div>
      </article>
      <section className="panel mt-8">
        <h2 className="mb-4 text-lg font-bold">Thông tin sản phẩm</h2>
        <p className="text-sm leading-7 text-muted">{product.description}</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-5 text-sm sm:grid-cols-[160px_1fr]">
          <dt className="text-muted">Thương hiệu</dt>
          <dd className="font-medium">{product.brand}</dd>
          <dt className="text-muted">Quy cách</dt>
          <dd>
            {product.packSize} × {product.size}
          </dd>
          <dt className="text-muted">Mã sản phẩm</dt>
          <dd className="break-all font-mono text-xs">{product.id}</dd>
        </dl>
      </section>
      <section className="mt-10">
        <h2 className="mb-5 text-xl font-bold">Thêm lựa chọn cho bạn</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {related.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
