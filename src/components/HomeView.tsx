"use client";
import Link from "next/link";
import { useState } from "react";
import { PRODUCTS } from "@/data/products";
import Header from "./Header";
import Footer from "./Footer";
import CategoryGrid from "./CategoryGrid";
import ProductFeed from "./ProductFeed";
import ProductVisual from "./ProductVisual";
import { Icon } from "./Icons";

export default function HomeView({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  function selectCategory(id: string | null) {
    setCategoryId(id);
    document.getElementById("san-pham")?.scrollIntoView({ behavior: "smooth" });
  }
  return (
    <>
      <Header query={query} onQueryChange={setQuery} />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-3 px-3 pt-3 sm:space-y-8 sm:px-6 sm:pt-6 lg:space-y-10">
        <section className="hero-grid relative isolate overflow-hidden rounded-2xl bg-[#102b58] text-white sm:rounded-[1.7rem]">
          <div className="absolute -right-10 top-0 -z-10 h-full w-2/3 bg-[radial-gradient(ellipse_at_center,#3072cc70,transparent_65%)]" />
          <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] items-center sm:min-h-72 md:grid-cols-[1.1fr_1fr] lg:min-h-96">
            <div className="min-w-0 py-5 pl-4 sm:px-8 sm:py-8 lg:px-12 lg:py-12">
              <p className="mb-2 text-[8px] font-bold tracking-[.08em] text-blue-200 sm:mb-5 sm:text-[10px] sm:tracking-[.18em]">
                GROOM BETTER. FEEL BETTER.
              </p>
              <h1 className="text-[18px] font-bold leading-[1.25] tracking-tight min-[400px]:text-xl sm:text-3xl lg:text-5xl">
                Chăm chút mỗi ngày.
                <br />
                <span className="text-blue-300">Tự tin là chính bạn.</span>
              </h1>
              <p className="mt-2 max-w-md text-[11px] leading-4 text-blue-100/90 sm:mt-5 sm:text-sm sm:leading-7">
                <span className="sm:hidden">
                  Chăm sóc tóc, da và cơ thể mỗi ngày.
                </span>
                <span className="hidden sm:inline">
                  Từ mái tóc đến làn da. Khám phá những sản phẩm chăm sóc dành
                  cho nhịp sống của phái mạnh.
                </span>
              </p>
              <a
                href="#san-pham"
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-[#102b58] hover:bg-blue-50 sm:mt-7 sm:gap-4 sm:rounded-xl sm:px-6 sm:py-3.5 sm:text-sm"
              >
                Khám phá ngay{" "}
                <Icon name="arrow" className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </a>
              <div className="mt-7 hidden items-center gap-3 text-[10px] tracking-wide text-blue-200 sm:flex">
                <span className="h-px w-8 bg-blue-300" /> 8 DANH MỤC · 400 LỰA
                CHỌN
              </div>
            </div>
            <div className="relative mx-auto flex h-40 w-full min-w-0 max-w-lg items-center justify-center pr-2 sm:h-72 sm:items-end sm:px-4 sm:pb-6 lg:h-96 lg:px-10 lg:pb-8">
              <span className="absolute right-4 top-4 hidden rounded-full border border-blue-200/30 px-3 py-2 text-[9px] tracking-widest text-blue-100 sm:block lg:right-9 lg:top-8">
                THE DAILY ESSENTIALS
              </span>
              <div className="absolute bottom-6 h-7 w-3/4 rounded-[50%] bg-blue-950/60 blur-lg" />
              <ProductVisual
                product={PRODUCTS[0]}
                decorative
                className="z-10 -mr-6 h-28 w-20 -rotate-12 sm:-mr-10 sm:h-48 sm:w-32 lg:h-64 lg:w-44"
              />
              <ProductVisual
                product={PRODUCTS[100]}
                decorative
                className="z-20 -mb-2 h-36 w-24 sm:h-60 sm:w-40 lg:h-80 lg:w-56"
              />
              <ProductVisual
                product={PRODUCTS[50]}
                decorative
                className="z-10 -ml-10 hidden h-48 w-32 rotate-12 sm:flex lg:h-64 lg:w-44"
              />
            </div>
          </div>
          <div className="hidden items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-7 py-3 text-[10px] text-blue-100 sm:flex sm:px-8 lg:px-12">
            <span>ĐƠN GIẢN HƠN. CHỈN CHU HƠN.</span>
            <span>
              01 <span className="mx-2 text-blue-300">━━━━</span> 03
            </span>
          </div>
        </section>
        <div className="grid grid-cols-3 gap-2 border-b border-line pb-3 sm:gap-4 sm:pb-6">
          {[
            {
              icon: "truck" as const,
              title: "Giao hàng theo nhu cầu",
              short: "Giao linh hoạt",
              detail: "Tiêu chuẩn hoặc giao nhanh",
            },
            {
              icon: "bag" as const,
              title: "Mua lẻ hay mua combo",
              short: "Mua lẻ / combo",
              detail: "Linh hoạt cho thói quen của bạn",
            },
            {
              icon: "shield" as const,
              title: "Rõ ràng trước khi đặt",
              short: "Rõ phí & ưu đãi",
              detail: "Xem đầy đủ phí ship & ưu đãi",
            },
          ].map((i) => (
            <div
              key={i.title}
              className="flex items-center justify-center gap-1.5 sm:gap-3"
            >
              <span className="rounded-lg bg-blue-50 p-1.5 text-brand sm:rounded-xl sm:p-3">
                <Icon name={i.icon} className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold sm:text-xs">
                  <span className="sm:hidden">{i.short}</span>
                  <span className="hidden sm:inline">{i.title}</span>
                </p>
                <p className="mt-1 hidden text-[11px] text-muted sm:block">
                  {i.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
        <CategoryGrid selectedId={categoryId} onSelect={selectCategory} />
        <section className="flex items-center justify-between gap-2 rounded-xl border border-blue-500 bg-linear-to-r from-blue-800 via-blue-700 to-blue-500 px-3 py-3 text-white shadow-md shadow-blue-600/20 sm:flex-wrap sm:gap-6 sm:rounded-2xl sm:px-6 sm:py-7 sm:shadow-lg lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:flex-wrap sm:gap-5">
            <span
              aria-hidden="true"
              className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-2 py-2 text-2xl font-extrabold tracking-tight sm:rounded-2xl sm:px-4 sm:py-3 sm:text-5xl"
            >
              −10%
            </span>
            <div className="min-w-0 flex-1 sm:basis-56">
              <p className="eyebrow mb-2 hidden text-blue-100 sm:block">
                ƯU ĐÃI DÀNH CHO BẠN
              </p>
              <h2 className="text-xs font-bold leading-4 sm:text-2xl sm:leading-snug">
                <span className="sm:hidden">Routine mới, giảm 10%</span>
                <span className="hidden sm:inline">
                  Bắt đầu routine mới, giảm ngay 10%
                </span>
              </h2>
              <p className="mt-1 text-[10px] leading-4 text-blue-100 sm:mt-3 sm:text-xs sm:leading-6">
                <span className="sm:hidden">Từ 200K · Tối đa 100K</span>
                <span className="hidden sm:inline">
                  Đơn từ 200K · Giảm tối đa 100K · Nhập mã tại bước thanh toán
                </span>
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-lg border-2 border-dashed border-blue-200 bg-white px-2 py-2 font-mono text-[11px] font-extrabold tracking-wide text-brand shadow-md sm:rounded-xl sm:px-6 sm:py-4 sm:text-xl sm:tracking-widest">
            HELLO10
          </span>
        </section>
        <ProductFeed
          query={query}
          categoryId={categoryId}
          onClearFilters={() => {
            setQuery("");
            setCategoryId(null);
          }}
        />
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e9eef5] p-4 sm:gap-5 sm:p-7">
          <div>
            <p className="eyebrow hidden text-muted sm:block">
              LESS EFFORT. MORE CONFIDENCE.
            </p>
            <h2 className="text-base font-bold sm:mt-2 sm:text-xl">
              Chăm sóc bản thân là một thói quen tốt.
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-5 text-muted sm:text-sm sm:leading-6">
              Chọn điều phù hợp với bạn, bắt đầu từ những bước nhỏ mỗi ngày.
            </p>
          </div>
          <Link href="/gio-hang" className="btn-secondary">
            Đến giỏ hàng <Icon name="arrow" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
