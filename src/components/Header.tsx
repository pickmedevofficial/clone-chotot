"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface HeaderProps {
  /** Khi truyền vào (trang chủ), ô tìm kiếm lọc trực tiếp; nếu không, gửi form sẽ về trang chủ. */
  query?: string;
  onQueryChange?: (query: string) => void;
}

export default function Header({ query, onQueryChange }: HeaderProps) {
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState("");
  const controlled = onQueryChange !== undefined;
  const value = controlled ? (query ?? "") : localQuery;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (controlled) {
      document.getElementById("tin-dang")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const q = localQuery.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <header className="sticky top-0 z-20 bg-brand shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap">
        <Link
          href="/"
          className="shrink-0 text-2xl font-bold tracking-tight text-foreground"
          aria-label="ChợMới — về trang chủ"
        >
          Chợ<span className="text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">Mới</span>
        </Link>

        <Link
          href="/admin"
          className="ml-auto shrink-0 rounded-md bg-brand-strong px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 sm:order-last"
        >
          Đăng tin
        </Link>

        <form
          role="search"
          onSubmit={handleSubmit}
          className="order-last flex w-full min-w-0 sm:order-none sm:flex-1"
        >
          <label htmlFor="site-search" className="sr-only">
            Tìm kiếm tin đăng
          </label>
          <input
            id="site-search"
            type="search"
            value={value}
            onChange={(e) =>
              controlled ? onQueryChange(e.target.value) : setLocalQuery(e.target.value)
            }
            placeholder="Tìm kiếm sản phẩm, xe cộ, nhà đất..."
            className="min-w-0 flex-1 rounded-l-md border-0 bg-white px-3 py-2 text-sm outline-none ring-brand-strong focus:ring-2"
          />
          <button
            type="submit"
            className="shrink-0 rounded-r-md bg-foreground px-4 text-sm font-medium text-white hover:bg-black"
          >
            Tìm
          </button>
        </form>
      </div>
    </header>
  );
}
