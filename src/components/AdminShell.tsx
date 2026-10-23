"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import { ADMIN_TABS, type AdminTab } from "@/lib/admin-tabs";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Khung trang quản trị: sidebar (drawer dưới 1024px) + header có breadcrumb.
 * Có `onNavigate` thì mục menu là nút đổi tab tại chỗ; nếu không, là link về
 * `/admin?tab=...` (dùng cho trang con như chi tiết sản phẩm).
 */
export default function AdminShell({
  active,
  onNavigate,
  pendingCount,
  crumbs,
  children,
}: {
  active: AdminTab;
  onNavigate?: (tab: AdminTab) => void;
  pendingCount: number;
  crumbs: Crumb[];
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const close = (restoreFocus: boolean) => {
      setMenuOpen(false);
      if (restoreFocus) menuButtonRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onResize = () => {
      if (desktop.matches) close(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuCloseRef.current?.focus();
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [menuOpen]);
  return (
    <div className="admin-shell">
      <div
        className={`admin-backdrop${menuOpen ? " open" : ""}`}
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
      />
      <aside
        id="admin-sidebar"
        className={`admin-sidebar${menuOpen ? " open" : ""}`}
      >
        <div className="flex items-start justify-between">
          <Link href="/" className="admin-logo">
            MEN <span className="admin-logo-accent">/</span> DAILY
            <small>KHÔNG GIAN QUẢN TRỊ</small>
          </Link>
          <button
            ref={menuCloseRef}
            type="button"
            className="admin-menu-close"
            aria-label="Đóng menu quản trị"
            onClick={() => {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }}
          >
            <FaXmark aria-hidden="true" />
          </button>
        </div>
        <p className="admin-sidebar-section px-7 pb-3 text-[10px] font-bold tracking-widest">
          CỬA HÀNG
        </p>
        <nav aria-label="Quản trị">
          {ADMIN_TABS.map(([id, label, SidebarIcon]) => {
            const content = (
              <>
                <SidebarIcon aria-hidden="true" className="admin-nav-icon" />
                {label}
                {id === "orders" && (
                  <span className="admin-order-count ml-auto rounded px-1.5 text-[10px]">
                    {pendingCount}
                  </span>
                )}
              </>
            );
            const props = {
              "aria-current": active === id ? ("page" as const) : undefined,
              className: active === id ? "selected" : "",
            };
            return onNavigate ? (
              <button
                key={id}
                type="button"
                {...props}
                onClick={() => {
                  onNavigate(id);
                  setMenuOpen(false);
                }}
              >
                {content}
              </button>
            ) : (
              <Link
                key={id}
                href={id === "overview" ? "/admin" : `/admin?tab=${id}`}
                {...props}
              >
                {content}
              </Link>
            );
          })}
        </nav>
        <div className="admin-side-note">
          <strong>MEN / DAILY Studio</strong>
          <p>Dữ liệu demo · Lưu cục bộ</p>
          <Link href="/">← Xem cửa hàng</Link>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-header">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              className="admin-menu-button"
              aria-label="Mở menu quản trị"
              aria-controls="admin-sidebar"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <FaBars aria-hidden="true" />
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <p className="truncate text-sm text-muted">
                {crumbs.map((c, i) => (
                  <Fragment key={`${c.label}-${i}`}>
                    {i > 0 && <span className="mx-2 text-slate-300">/</span>}
                    {c.href ? (
                      <Link href={c.href} className="hover:text-brand">
                        {c.label}
                      </Link>
                    ) : (
                      <span
                        className={
                          i === crumbs.length - 1 ? "text-foreground" : ""
                        }
                        aria-current={
                          i === crumbs.length - 1 ? "page" : undefined
                        }
                      >
                        {c.label}
                      </span>
                    )}
                  </Fragment>
                ))}
              </p>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-xs text-muted sm:block">
              Đến cửa hàng ↗
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-brand">
              AD
            </span>
            <div className="hidden text-xs sm:block">
              <strong>Quản trị viên</strong>
              <p className="mt-1 text-muted">Chế độ demo</p>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
