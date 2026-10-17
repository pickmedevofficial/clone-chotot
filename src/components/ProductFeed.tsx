"use client";
import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { getCategoryName } from "@/data/categories";
import { filterProducts } from "@/lib/search";
import ProductCard from "./ProductCard";

export default function ProductFeed(props: {
  query: string;
  categoryId: string | null;
  onClearFilters: () => void;
}) {
  // Remount controls on a changed search/category, so a previous brand cannot hide a new category.
  return <Feed key={`${props.query}|${props.categoryId}`} {...props} />;
}
function Feed({
  query,
  categoryId,
  onClearFilters,
}: {
  query: string;
  categoryId: string | null;
  onClearFilters: () => void;
}) {
  const [sort, setSort] = useState("featured");
  const [brand, setBrand] = useState("");
  const [pack, setPack] = useState("");
  const [limit, setLimit] = useState(20);
  const filtered = useMemo(
    () => filterProducts(PRODUCTS, query, categoryId),
    [query, categoryId],
  );
  const brands = [...new Set(filtered.map((p) => p.brand))].sort();
  const visible = useMemo(() => {
    const result = filtered.filter(
      (p) =>
        (!brand || p.brand === brand) &&
        (!pack || (pack === "single" ? p.packSize === 1 : p.packSize > 1)),
    );
    return result.sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "name"
            ? a.title.localeCompare(b.title, "vi")
            : a.packSize - b.packSize || a.unitPrice - b.unitPrice,
    );
  }, [filtered, brand, pack, sort]);
  const hasFilter = !!(query || categoryId || brand || pack);
  return (
    <section
      id="san-pham"
      className="scroll-mt-32 sm:scroll-mt-28"
      aria-labelledby="products-heading"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 sm:mb-5 sm:gap-4">
        <div>
          <p className="eyebrow mb-2 hidden text-brand sm:block">
            THE EVERYDAY COLLECTION
          </p>
          <h2 id="products-heading" className="text-lg font-bold sm:text-2xl">
            {categoryId
              ? getCategoryName(categoryId)
              : "Thiết yếu cho phái mạnh"}
            <span className="ml-2 align-middle text-[10px] font-normal text-muted sm:ml-3 sm:text-sm">
              {visible.length} lựa chọn
            </span>
          </h2>
          <p className="mt-1 text-[10px] text-muted sm:mt-2 sm:text-xs">
            <span className="sm:hidden">Giá tham khảo · Mua lẻ & combo</span>
            <span className="hidden sm:inline">
              Giá tham khảo · 10 dòng mỗi danh mục, có mua lẻ và combo
            </span>
            {query && ` · Tìm “${query}”`}
          </p>
        </div>
        {hasFilter && (
          <button
            onClick={() => {
              setBrand("");
              setPack("");
              setLimit(20);
              onClearFilters();
            }}
            className="text-xs font-semibold text-brand underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
      <div className="mb-3 flex flex-wrap gap-2 sm:mb-5 sm:gap-3">
        <label className="sr-only" htmlFor="brand-filter">
          Thương hiệu
        </label>
        <select
          id="brand-filter"
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            setLimit(20);
          }}
          className="field min-h-10 w-auto! flex-1 px-2! py-2! text-[11px]! sm:flex-none sm:px-3! sm:text-sm!"
        >
          <option value="">Thương hiệu</option>
          {brands.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="pack-filter">
          Quy cách
        </label>
        <select
          id="pack-filter"
          value={pack}
          onChange={(e) => {
            setPack(e.target.value);
            setLimit(20);
          }}
          className="field min-h-10 w-auto! flex-1 px-2! py-2! text-[11px]! sm:flex-none sm:px-3! sm:text-sm!"
        >
          <option value="">Lẻ / combo</option>
          <option value="single">Mua lẻ</option>
          <option value="combo">Combo tiết kiệm thời gian</option>
        </select>
        <label className="sr-only" htmlFor="sort">
          Sắp xếp
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="field ml-auto min-h-10 w-auto! flex-1 px-2! py-2! text-[11px]! sm:flex-none sm:px-3! sm:text-sm!"
        >
          <option value="featured">Gợi ý</option>
          <option value="price-asc">Giá thấp đến cao</option>
          <option value="price-desc">Giá cao đến thấp</option>
          <option value="name">Tên A → Z</option>
        </select>
      </div>
      {visible.length ? (
        <>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.slice(0, limit).map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
          {limit < visible.length && (
            <div className="mt-7 text-center">
              <button
                className="btn-secondary min-w-64"
                onClick={() => setLimit((n) => n + 20)}
              >
                Xem thêm {Math.min(20, visible.length - limit)} sản phẩm{" "}
                <span className="text-muted">↓</span>
              </button>
              <p className="mt-3 text-xs text-muted">
                Đang xem {Math.min(limit, visible.length)} / {visible.length}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="panel py-16 text-center">
          <p className="font-semibold">Chưa có sản phẩm phù hợp</p>
          <p className="mt-2 text-sm text-muted">
            Thử tên thương hiệu khác hoặc xóa bộ lọc.
          </p>
        </div>
      )}
    </section>
  );
}
