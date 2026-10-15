"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { LOCATIONS } from "@/data/categories";

interface HeaderProps {
  /**
   * Khi truyền các callback (trang chủ), ô tìm kiếm và khu vực lọc trực tiếp;
   * nếu không, gửi form sẽ về trang chủ kèm `?q=&kv=`.
   */
  query?: string;
  onQueryChange?: (query: string) => void;
  location?: string | null;
  onLocationChange?: (location: string | null) => void;
  /** Hiện slogan và banner lớn (trang chủ). */
  hero?: boolean;
}

const NAV = [
  { label: "ChợMới", q: "" },
  { label: "Xe cộ", q: "Xe cộ" },
  { label: "Bất động sản", q: "Bất động sản" },
  { label: "Việc làm", q: "Việc làm" },
];

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const iconButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition hover:bg-white/80";
const pillButton =
  "flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white/80";

export default function Header({ query, onQueryChange, location, onLocationChange, hero = false }: HeaderProps) {
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState("");
  const [localLocation, setLocalLocation] = useState<string | null>(null);
  const controlled = onQueryChange !== undefined;
  const queryValue = controlled ? (query ?? "") : localQuery;
  const locationValue = onLocationChange ? (location ?? null) : localLocation;

  function changeLocation(value: string) {
    const next = value || null;
    if (onLocationChange) onLocationChange(next);
    else setLocalLocation(next);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (controlled) {
      document.getElementById("tin-dang")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const params = new URLSearchParams();
    const q = localQuery.trim();
    if (q) params.set("q", q);
    if (localLocation) params.set("kv", localLocation);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <header className="relative bg-gradient-to-b from-[#ffc933] to-brand">
      {hero && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden text-5xl lg:block">
          <span className="absolute left-[6%] top-16 rotate-[-15deg] opacity-80">🪑</span>
          <span className="absolute left-[17%] top-20 rotate-12 opacity-90">🛹</span>
          <span className="absolute left-[24%] top-14 rotate-[-8deg] opacity-80">📦</span>
          <span className="absolute right-[24%] top-16 rotate-[-10deg] opacity-80">💻</span>
          <span className="absolute right-[15%] top-14 rotate-6 opacity-90">🧊</span>
          <span className="absolute right-[5%] top-20 rotate-12 opacity-80">🛵</span>
        </div>
      )}

      <div className="relative mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 lg:px-6">
        <button type="button" className={iconButton} aria-label="Mở menu">
          <Icon>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </Icon>
        </button>
        <Link
          href="/"
          className="flex h-10 shrink-0 items-center rounded-full bg-white px-4 text-xl font-bold tracking-tight text-brand-strong shadow-sm"
          aria-label="ChợMới — về trang chủ"
        >
          chợ<span className="uppercase">Mới</span>
        </Link>
        <Link href="/admin" className="hidden shrink-0 items-center gap-1 text-sm font-semibold xl:flex">
          Dành cho người bán
          <Icon className="h-4 w-4">
            <path d="m6 9 6 6 6-6" />
          </Icon>
        </Link>

        <nav aria-label="Chuyên trang" className="mx-auto hidden items-center gap-8 lg:flex">
          {NAV.map((item, i) => (
            <Link
              key={item.label}
              href={item.q ? `/?q=${encodeURIComponent(item.q)}` : "/"}
              className={`text-sm font-semibold transition ${i === 0 ? "text-foreground" : "text-foreground/50 hover:text-foreground"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button type="button" className={`${iconButton} max-sm:hidden`} aria-label="Tin đã lưu">
            <Icon>
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </Icon>
          </button>
          <button type="button" className={`${iconButton} max-sm:hidden`} aria-label="Thông báo">
            <Icon>
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </Icon>
          </button>
          <button type="button" className={`${pillButton} max-md:hidden`}>
            <Icon className="h-4 w-4">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Icon>
            Liên hệ
          </button>
          <button type="button" className={`${pillButton} max-md:hidden`}>
            Đăng nhập
          </button>
          <Link
            href="/admin"
            className="flex h-10 shrink-0 items-center rounded-full bg-foreground px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          >
            Đăng tin
          </Link>
          <button type="button" className={`${pillButton} gap-2 px-3`} aria-label="Tài khoản">
            <Icon>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 20.66V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.66" />
            </Icon>
            <Icon className="h-4 w-4 max-sm:hidden">
              <path d="m6 9 6 6 6-6" />
            </Icon>
          </button>
        </div>
      </div>

      <div className={`relative px-4 ${hero ? "pt-4 sm:pt-8" : "pt-1"}`}>
        {hero && (
          <p className="mb-6 text-center text-2xl font-bold text-foreground sm:mb-10 sm:text-4xl">
            Giá tốt, gần bạn, chốt nhanh!
          </p>
        )}
        {/* Ô tìm kiếm nằm đè lên mép dưới banner: phần âm margin được bù bằng spacer bên dưới. */}
        <form
          role="search"
          onSubmit={handleSubmit}
          className="relative z-10 mx-auto -mb-9 flex max-w-4xl flex-wrap items-center gap-2 rounded-2xl bg-white p-2 shadow-lg sm:flex-nowrap sm:p-3"
        >
          <label htmlFor="site-search" className="sr-only">
            Tìm kiếm tin đăng
          </label>
          <div className="flex min-w-0 basis-full items-center gap-2 px-2 sm:flex-1 sm:basis-auto">
            <Icon className="h-5 w-5 shrink-0 text-foreground">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </Icon>
            <input
              id="site-search"
              type="search"
              value={queryValue}
              onChange={(e) => (controlled ? onQueryChange(e.target.value) : setLocalQuery(e.target.value))}
              placeholder="Tìm sản phẩm..."
              className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            />
          </div>
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <label htmlFor="site-location" className="sr-only">
              Khu vực
            </label>
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-strong">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </Icon>
            <select
              id="site-location"
              value={locationValue ?? ""}
              onChange={(e) => changeLocation(e.target.value)}
              className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white pl-9 pr-9 text-sm font-semibold outline-none ring-brand-strong focus:ring-2 sm:w-48"
            >
              <option value="">Chọn khu vực</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true">
              <path d="M6 9h12l-6 7z" />
            </svg>
          </div>
          <button
            type="submit"
            className="h-12 shrink-0 rounded-lg bg-brand px-5 text-base font-semibold text-foreground transition hover:brightness-95"
          >
            Tìm kiếm
          </button>
        </form>
      </div>
      <div aria-hidden="true" className={`relative bg-background ${hero ? "h-12" : "h-11"}`} />
    </header>
  );
}
