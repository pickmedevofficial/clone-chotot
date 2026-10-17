"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { useCart } from "@/lib/commerce-store";
import { Icon } from "./Icons";

export default function Header({
  query,
  onQueryChange,
}: {
  query?: string;
  onQueryChange?: (q: string) => void;
}) {
  const router = useRouter();
  const searchId = useId();
  const cart = useCart();
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  const [localQuery, setLocalQuery] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (onQueryChange)
      document
        .getElementById("san-pham")
        ?.scrollIntoView({ behavior: "smooth" });
    else router.push(`/?q=${encodeURIComponent(localQuery.trim())}#san-pham`);
  }
  return (
    <>
      <div className="bg-[#101f36] px-3 py-1 text-center text-[10px] tracking-wide text-blue-100 sm:px-4 sm:py-2 sm:text-xs">
        <span className="hidden sm:inline">
          CHĂM SÓC BẢN THÂN, BẮT ĐẦU TỪ HÔM NAY{" "}
          <span className="mx-3 opacity-30">/</span>
        </span>{" "}
        Miễn phí giao tiêu chuẩn từ 499K
      </div>
      <header className="sticky top-0 z-30 border-b border-blue-700 bg-brand text-white shadow-lg shadow-blue-950/15">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-4 lg:gap-10">
          <Link
            href="/"
            className="shrink-0"
            aria-label="MEN DAILY — Trang chủ"
          >
            <span className="text-xl font-extrabold tracking-[-1px] sm:text-[23px] sm:tracking-[-1.5px]">
              MEN <span className="font-light text-blue-200">/</span> DAILY
              <span className="text-blue-200">.</span>
            </span>
            <span className="mt-0.5 hidden text-[8px] font-semibold tracking-[.22em] text-blue-100 sm:block">
              CHĂM SÓC NAM MỖI NGÀY
            </span>
          </Link>
          <form
            role="search"
            onSubmit={submit}
            className="order-last flex w-full items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-foreground shadow-sm sm:order-none sm:w-auto sm:flex-1 sm:rounded-xl sm:px-4"
          >
            <Icon name="search" className="shrink-0 text-muted" />
            <label htmlFor={searchId} className="sr-only">
              Tìm sản phẩm hoặc thương hiệu
            </label>
            <input
              id={searchId}
              type="search"
              aria-label="Tìm sản phẩm hoặc thương hiệu"
              value={onQueryChange ? (query ?? "") : localQuery}
              onChange={(e) =>
                onQueryChange
                  ? onQueryChange(e.target.value)
                  : setLocalQuery(e.target.value)
              }
              placeholder="Bạn đang tìm sản phẩm gì?"
              className="min-h-10 w-full min-w-0 bg-transparent py-2 text-xs outline-none sm:py-3 sm:text-sm"
            />
            <button
              type="submit"
              className="shrink-0 text-xs font-semibold text-brand"
            >
              Tìm kiếm
            </button>
          </form>
          <nav
            className="ml-auto flex shrink-0 items-center gap-4 text-sm"
            aria-label="Điều hướng chính"
          >
            <Link
              href="/don-hang"
              className="text-xs font-semibold text-blue-50 hover:text-white hover:underline sm:text-sm"
            >
              Đơn hàng
            </Link>
            <Link
              href="/gio-hang"
              className="flex items-center gap-2 rounded-xl border border-white/70 bg-white px-3 py-2.5 font-semibold text-brand shadow-sm hover:bg-blue-50"
              aria-label={`Giỏ hàng, ${count} sản phẩm`}
            >
              <Icon name="cart" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] text-white">
                {count}
              </span>
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
