"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getCategoryName } from "@/data/categories";
import { filterProducts } from "@/lib/search";
import { FEATURED_ORDER } from "@/data/mock-products";
import type { Product } from "@/types/product";

type Tab = "for-you" | "newest";

const TABS: { id: Tab; label: string }[] = [
  { id: "for-you", label: "Dành cho bạn" },
  { id: "newest", label: "Mới nhất" },
];

function forYouOrder(products: Product[]): Product[] {
  const rank = new Map(FEATURED_ORDER.map((id, i) => [id, i]));
  // `products` đã sắp theo mới nhất; tin của người dùng đứng sau các tin gợi ý.
  return [...products].sort(
    (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

interface ProductFeedProps {
  products: Product[];
  query: string;
  categoryId: string | null;
  location: string | null;
  onClearFilters: () => void;
}

export default function ProductFeed({ products, query, categoryId, location, onClearFilters }: ProductFeedProps) {
  const [tab, setTab] = useState<Tab>("for-you");

  const visible = useMemo(() => {
    const ordered = tab === "newest" ? products : forYouOrder(products);
    return filterProducts(ordered, query, categoryId, location);
  }, [products, tab, query, categoryId, location]);

  const hasFilter = query.trim() !== "" || categoryId !== null || location !== null;

  return (
    <section id="tin-dang" aria-labelledby="tin-dang-heading" className="scroll-mt-28 rounded-lg bg-surface p-4">
      <h2 id="tin-dang-heading" className="sr-only">
        Tin đăng
      </h2>
      <div className="mb-3 flex gap-6 border-b border-line" aria-label="Sắp xếp tin đăng" role="group">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition sm:text-base ${
              tab === t.id ? "border-brand-strong text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {hasFilter && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">
            {visible.length} tin
            {categoryId && (
              <>
                {" "}trong <strong className="text-foreground">{getCategoryName(categoryId)}</strong>
              </>
            )}
            {location && (
              <>
                {" "}tại <strong className="text-foreground">{location}</strong>
              </>
            )}
            {query.trim() && (
              <>
                {" "}khớp “<strong className="break-all text-foreground">{query.trim()}</strong>”
              </>
            )}
          </span>
          <button type="button" onClick={onClearFilters} className="text-brand-strong underline">
            Bỏ lọc
          </button>
        </div>
      )}

      <div id="feed-panel">
        {visible.length === 0 ? (
          <p className="py-12 text-center text-muted">Không có tin phù hợp</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {visible.map((p) => (
              <li key={p.id} className="flex min-w-0">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
