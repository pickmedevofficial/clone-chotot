"use client";

import Link from "next/link";
import { useState } from "react";
import AboutSection from "@/components/AboutSection";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductFeed from "@/components/ProductFeed";
import { useProducts } from "@/lib/product-store";

export default function HomeView({ initialQuery = "" }: { initialQuery?: string }) {
  const products = useProducts();
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  function selectCategory(id: string | null) {
    setCategoryId(id);
    if (id) document.getElementById("tin-dang")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Header query={query} onQueryChange={setQuery} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4">
        <section
          aria-label="Giới thiệu"
          className="flex flex-col gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-brand to-brand-strong p-5 text-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div className="min-w-0">
            <p className="text-xl font-bold sm:text-3xl">Mua nhanh, bán gọn, ngay gần bạn</p>
            <p className="mt-1 text-sm sm:text-base">Tìm món đồ bạn cần hoặc đăng bán đồ không dùng đến. Đăng tin miễn phí.</p>
          </div>
          <Link
            href="/admin"
            className="self-start rounded-md bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-white/90 sm:self-auto"
          >
            Đăng tin ngay
          </Link>
        </section>
        <CategoryGrid selectedId={categoryId} onSelect={selectCategory} />
        <ProductFeed
          products={products}
          query={query}
          categoryId={categoryId}
          onClearFilters={() => {
            setQuery("");
            setCategoryId(null);
          }}
        />
        <AboutSection />
      </main>
      <Footer />
    </>
  );
}
