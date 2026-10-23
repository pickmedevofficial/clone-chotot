"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowUpRightFromSquare,
  FaBars,
  FaBoxOpen,
  FaChartLine,
  FaClipboardList,
  FaHouse,
  FaReceipt,
  FaSackDollar,
  FaStar,
  FaUserGroup,
  FaUserTie,
  FaXmark,
} from "react-icons/fa6";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import { useOrders } from "@/lib/commerce-store";
import { formatPrice as money, formatDate } from "@/lib/format";
import {
  customerSummary,
  employeeRevenue,
  mergeOrders,
  normalizePhone,
  seedAdmin,
  STATUS_LABELS,
  validPhone,
  type AdminData,
  type AdminStatus,
  type Customer,
  type Employee,
} from "@/lib/admin";

const KEY = "mendaily:admin:v1";
const seed = seedAdmin();
let rawCache: string | null | undefined;
let cache = seed;
const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}
function snapshot() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== rawCache) {
      rawCache = raw;
      const d = raw ? JSON.parse(raw) : seed;
      cache =
        d &&
        Array.isArray(d.employees) &&
        Array.isArray(d.customers) &&
        Array.isArray(d.orders) &&
        d.overrides &&
        d.orderUpdates
          ? d
          : seed;
    }
  } catch {
    cache = seed;
  }
  return cache;
}
const tabs = [
  ["overview", "Tổng quan", FaHouse],
  ["orders", "Đơn hàng", FaClipboardList],
  ["employees", "Nhân viên", FaUserTie],
  ["sales", "Doanh số nhân viên", FaChartLine],
  ["products", "Sản phẩm", FaBoxOpen],
  ["customers", "Khách hàng", FaUserGroup],
] as const satisfies readonly (readonly [string, string, IconType])[];
type Tab = (typeof tabs)[number][0];
type Modal =
  | { kind: "employee"; value?: Employee }
  | { kind: "customer"; value?: Customer }
  | { kind: "product"; id: string }
  | { kind: "order"; id: string }
  | null;
function Badge({ status }: { status: AdminStatus }) {
  return (
    <span className={`admin-badge status-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
export default function AdminView() {
  const data = useSyncExternalStore(subscribe, snapshot, () => seed);
  const storefront = useOrders();
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
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
  const orders = mergeOrders(data, storefront);
  const customers = customerSummary(data.customers, orders);
  const latest = orders[0]?.createdAt ?? "2026-10-23";
  const scoped = orders.filter(
    (o) =>
      period === "all" ||
      Date.parse(latest) - Date.parse(o.createdAt) < Number(period) * 86400000,
  );
  const done = scoped.filter((o) => o.status === "completed");
  const revenue = done.reduce((s, o) => s + o.merchandise, 0);
  const ranking = [...data.employees].sort(
    (a, b) => employeeRevenue(scoped, b.id) - employeeRevenue(scoped, a.id),
  );
  const text = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const matches = (...s: string[]) =>
    s.some((v) => text(v).includes(text(query)));
  function navigate(t: Tab) {
    setTab(t);
    setQuery("");
    setFilter("all");
    setPage(1);
    setMenuOpen(false);
  }
  function open(m: Modal) {
    setError("");
    setModal(m);
  }
  function save(next: AdminData) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      listeners.forEach((fn) => fn());
      setNotice("Đã lưu thay đổi trên trình duyệt này.");
      setError("");
      setModal(null);
    } catch {
      setError(
        "Không thể lưu. Kiểm tra quyền hoặc dung lượng bộ nhớ trình duyệt.",
      );
    }
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    if (modal.kind === "employee" || modal.kind === "customer") {
      if (!validPhone(v("phone"))) {
        setError("Nhập số điện thoại di động Việt Nam hợp lệ.");
        return;
      }
      const phone = normalizePhone(v("phone"));
      if (modal.kind === "employee") {
        if (
          data.employees.some(
            (x) => x.phone === phone && x.id !== modal.value?.id,
          )
        ) {
          setError("Số điện thoại nhân viên đã tồn tại.");
          return;
        }
        const employee: Employee = {
          id: modal.value?.id ?? `NV-${crypto.randomUUID().slice(0, 8)}`,
          name: v("name"),
          phone,
          role: v("role"),
          target: Number(v("target")),
          active: v("active") === "true",
        };
        save({
          ...data,
          employees: modal.value
            ? data.employees.map((x) => (x.id === employee.id ? employee : x))
            : [...data.employees, employee],
        });
      } else {
        if (
          customers.some(
            (c) => c.phone === phone && c.phone !== modal.value?.phone,
          )
        ) {
          setError("Khách hàng có số điện thoại này đã tồn tại.");
          return;
        }
        save({
          ...data,
          customers: [
            ...data.customers.filter((c) => normalizePhone(c.phone) !== phone),
            {
              name: v("name"),
              phone,
              email: v("email"),
              address: v("address"),
            },
          ],
        });
      }
    } else if (modal.kind === "product")
      save({
        ...data,
        overrides: {
          ...data.overrides,
          [modal.id]: {
            price: Number(v("price")),
            stock: Number(v("stock")),
            active: v("active") === "true",
          },
        },
      });
    else
      save({
        ...data,
        orderUpdates: {
          ...data.orderUpdates,
          [modal.id]: {
            status: v("status") as AdminStatus,
            employeeId: v("employee"),
          },
        },
      });
  }
  const selectedOrder =
    modal?.kind === "order" ? orders.find((o) => o.id === modal.id) : undefined;
  const selectedProduct =
    modal?.kind === "product"
      ? PRODUCTS.find((p) => p.id === modal.id)
      : undefined;
  const foundOrders = scoped.filter(
    (o) =>
      matches(o.id, o.customer.name, o.customer.phone) &&
      (filter === "all" || o.status === filter),
  );
  const foundProducts = PRODUCTS.filter(
    (p) =>
      matches(p.id, p.title, p.brand) &&
      (filter === "all" || p.categoryId === filter),
  );
  const foundCustomers = customers.filter((c) =>
    matches(c.name, c.phone, c.email),
  );
  const foundEmployees = ranking.filter((e) => matches(e.name, e.phone, e.id));
  const slice = <T,>(rows: T[]) => rows.slice((page - 1) * 12, page * 12);
  function pager(total: number) {
    return (
      <div className="admin-pagination">
        <span>
          {total ? Math.min((page - 1) * 12 + 1, total) : 0}–
          {Math.min(page * 12, total)} / {total} kết quả
        </span>
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </button>
          <span>{page}</span>
          <button
            className="btn-secondary"
            disabled={page * 12 >= total}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </button>
        </div>
      </div>
    );
  }
  function orderRows(rows: typeof orders) {
    return (
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Đơn hàng</th>
              <th>Khách hàng</th>
              <th>Nhân viên</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <button
                    className="admin-action"
                    onClick={() => open({ kind: "order", id: o.id })}
                  >
                    {o.id}
                  </button>
                  <small>{formatDate(o.createdAt)}</small>
                </td>
                <td>
                  <strong>{o.customer.name}</strong>
                  <small>{o.customer.phone}</small>
                </td>
                <td>
                  {data.employees.find((e) => e.id === o.employeeId)?.name ??
                    "Chưa phân công"}
                </td>
                <td className="whitespace-nowrap font-semibold">
                  {money(o.total)}
                </td>
                <td>
                  <Badge status={o.status} />
                </td>
                <td>
                  <button
                    className="admin-action"
                    aria-label={`Chi tiết ${o.id}`}
                    onClick={() => open({ kind: "order", id: o.id })}
                  >
                    <FaArrowUpRightFromSquare aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty />}
      </div>
    );
  }
  const bars = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.parse(latest) - (6 - i) * 86400000)
      .toISOString()
      .slice(0, 10);
    return {
      day,
      value: done
        .filter((o) => o.createdAt.startsWith(day))
        .reduce((s, o) => s + o.merchandise, 0),
    };
  });
  const maxBar = Math.max(1, ...bars.map((b) => b.value));
  const metricCards: {
    label: string;
    value: string;
    note: string;
    icon: IconType;
  }[] = [
    {
      label: "Doanh số thuần",
      value: money(revenue),
      note: "Tiền hàng đơn hoàn tất",
      icon: FaSackDollar,
    },
    {
      label: "Đơn hàng",
      value: String(scoped.length),
      note: `${done.length} đơn hoàn tất`,
      icon: FaReceipt,
    },
    {
      label: "Khách hàng",
      value: String(customers.length),
      note: "Hồ sơ theo số điện thoại",
      icon: FaUserGroup,
    },
    {
      label: "Điểm tích lũy",
      value: customers
        .reduce((sum, customer) => sum + customer.points, 0)
        .toLocaleString("vi-VN"),
      note: "1 điểm / 10.000đ tiền hàng",
      icon: FaStar,
    },
  ];
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
          {tabs.map(([id, label, SidebarIcon]) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "selected" : ""}
            >
              <SidebarIcon aria-hidden="true" className="admin-nav-icon" />
              {label}
              {id === "orders" && (
                <span className="admin-order-count ml-auto rounded px-1.5 text-[10px]">
                  {orders.filter((o) => o.status === "pending").length}
                </span>
              )}
            </button>
          ))}
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
            <p className="truncate text-sm text-muted">
              Quản trị <span className="mx-2 text-slate-300">/</span>
              <span className="text-foreground">
                {tabs.find((t) => t[0] === tab)?.[1]}
              </span>
            </p>
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
        <main className="mx-auto max-w-[1500px] p-4 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 text-brand">MEN / DAILY MANAGEMENT</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {tab === "overview"
                  ? "Mỗi ngày, một bước tiến."
                  : tabs.find((t) => t[0] === tab)?.[1]}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {tab === "overview"
                  ? "Cùng nhìn lại hoạt động kinh doanh của cửa hàng."
                  : tab === "sales"
                    ? "Ghi nhận đóng góp. Theo dõi mục tiêu. Phát triển đội ngũ."
                    : "Quản lý tập trung, cập nhật dễ dàng."}
              </p>
            </div>
            <div className="flex gap-2">
              {["overview", "orders", "sales"].includes(tab) && (
                <select
                  className="field !w-auto"
                  aria-label="Khoảng thời gian"
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Toàn bộ thời gian</option>
                  <option value="7">7 ngày gần nhất</option>
                  <option value="30">30 ngày gần nhất</option>
                </select>
              )}
              {tab === "employees" && (
                <button
                  className="btn-primary"
                  onClick={() => open({ kind: "employee" })}
                >
                  + Thêm nhân viên
                </button>
              )}
              {tab === "customers" && (
                <button
                  className="btn-primary"
                  onClick={() => open({ kind: "customer" })}
                >
                  + Thêm khách hàng
                </button>
              )}
            </div>
          </div>
          <p className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-blue-800">
            Bản admin demo · 36 đơn mẫu, 4 nhân viên, 12 khách và{" "}
            {PRODUCTS.length} SKU. Đơn từ cửa hàng trên trình duyệt này tự xuất
            hiện tại đây. Chưa có đăng nhập hoặc máy chủ; chỉ dùng dữ liệu giả
            để thử nghiệm.
          </p>
          {notice && (
            <div
              role="status"
              className="mb-4 flex justify-between rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {notice}
              <button onClick={() => setNotice("")} aria-label="Đóng thông báo">
                ×
              </button>
            </div>
          )}
          {(tab === "overview" || tab === "sales") && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map(({ label, value, note, icon: CardIcon }) => (
                <div key={label} className="panel !p-5">
                  <div className="flex items-center justify-between text-xs text-muted">
                    {label}
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand">
                      <CardIcon aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight">
                    {value}
                  </p>
                  <p className="mt-2 text-xs text-muted">{note}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "overview" && (
            <>
              <div className="mb-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <section className="panel">
                  <h2 className="font-semibold">Nhịp kinh doanh</h2>
                  <p className="mt-1 text-xs text-muted">
                    Doanh số hoàn tất · 7 ngày tính đến {formatDate(latest)}
                  </p>
                  <div
                    className="mt-8 flex h-48 items-end gap-3 sm:gap-6"
                    role="img"
                    aria-label="Biểu đồ doanh số 7 ngày"
                  >
                    {bars.map((b, i) => (
                      <div
                        key={b.day}
                        className="flex flex-1 flex-col gap-2 text-center"
                      >
                        <span className="text-[10px] text-muted">
                          {Math.round(b.value / 1000)}k
                        </span>
                        <div
                          className={`rounded-t-lg ${i === 6 ? "bg-brand" : "bg-blue-200"}`}
                          style={{
                            height: Math.max(3, (b.value / maxBar) * 130),
                          }}
                          title={money(b.value)}
                        />
                        <span className="text-[10px] text-muted">
                          {b.day.slice(8)}/{b.day.slice(5, 7)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel">
                  <h2 className="font-semibold">Đội ngũ nổi bật</h2>
                  <p className="mt-1 text-xs text-muted">
                    Xếp hạng doanh số hoàn tất
                  </p>
                  <div className="mt-5 space-y-5">
                    {ranking.slice(0, 3).map((e, i) => (
                      <div key={e.id} className="flex items-center gap-3">
                        <span className="text-xs text-muted">0{i + 1}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-brand">
                          {e.name
                            .split(" ")
                            .slice(-2)
                            .map((s) => s[0])
                            .join("")}
                        </span>
                        <div className="flex-1 text-xs">
                          <strong>{e.name}</strong>
                          <p className="mt-1 text-muted">{e.role}</p>
                        </div>
                        <strong className="text-xs">
                          {money(employeeRevenue(scoped, e.id))}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <button
                    className="admin-action mt-6"
                    onClick={() => navigate("sales")}
                  >
                    Xem doanh số đội ngũ →
                  </button>
                </section>
              </div>
              <section className="admin-panel">
                <div className="flex items-center justify-between p-5">
                  <h2 className="font-semibold">Đơn hàng gần đây</h2>
                  <button
                    className="admin-action"
                    onClick={() => navigate("orders")}
                  >
                    Tất cả đơn hàng →
                  </button>
                </div>
                {orderRows(scoped.slice(0, 6))}
              </section>
            </>
          )}
          {tab !== "overview" && (
            <section className="admin-panel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
                <h2 className="text-sm font-semibold">
                  {tab === "sales"
                    ? "Bảng thành tích đội ngũ"
                    : `Danh sách ${tabs.find((t) => t[0] === tab)?.[1].toLowerCase()}`}
                </h2>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <input
                    className="field sm:!w-60"
                    aria-label="Tìm kiếm"
                    placeholder="Tìm theo tên, mã, số điện thoại…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                  {(tab === "orders" || tab === "products") && (
                    <select
                      className="field !w-auto"
                      aria-label="Bộ lọc"
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">
                        {tab === "orders" ? "Mọi trạng thái" : "Mọi danh mục"}
                      </option>
                      {tab === "orders"
                        ? Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))
                        : CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                    </select>
                  )}
                </div>
              </div>
              {tab === "orders" && (
                <>
                  {orderRows(slice(foundOrders))}
                  {pager(foundOrders.length)}
                </>
              )}
              {(tab === "employees" || tab === "sales") && (
                <>
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nhân viên</th>
                          <th>
                            {tab === "employees" ? "Liên hệ" : "Đơn hoàn tất"}
                          </th>
                          <th>Doanh số thuần</th>
                          <th>Mục tiêu tham chiếu</th>
                          <th>Trạng thái</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {foundEmployees.map((e) => {
                          const amount = employeeRevenue(scoped, e.id);
                          const percent = e.target
                            ? Math.round((amount / e.target) * 100)
                            : 0;
                          return (
                            <tr key={e.id}>
                              <td>
                                <strong>{e.name}</strong>
                                <small>
                                  {e.id} · {e.role}
                                </small>
                              </td>
                              <td>
                                {tab === "employees"
                                  ? e.phone
                                  : done.filter((o) => o.employeeId === e.id)
                                      .length}
                              </td>
                              <td className="whitespace-nowrap font-semibold text-brand">
                                {money(amount)}
                              </td>
                              <td>
                                <p className="whitespace-nowrap text-xs">
                                  {money(e.target)} · {percent}%
                                </p>
                                <div className="mt-2 h-1.5 w-32 overflow-hidden rounded bg-slate-100">
                                  <div
                                    className="h-full bg-brand"
                                    style={{
                                      width: `${Math.min(100, percent)}%`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`admin-badge ${e.active ? "status-completed" : "status-cancelled"}`}
                                >
                                  {e.active ? "Đang làm việc" : "Tạm nghỉ"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="admin-action"
                                  onClick={() =>
                                    open({ kind: "employee", value: e })
                                  }
                                >
                                  Chỉnh sửa
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!foundEmployees.length && <Empty />}
                  </div>
                  <p className="admin-footnote">
                    Doanh số = tiền hàng sau giảm giá của đơn hoàn tất, không
                    gồm phí giao hàng. Đơn hủy tự loại khỏi doanh số và điểm.
                    Mục tiêu là giá trị tham chiếu cho khoảng thời gian đã chọn.
                  </p>
                </>
              )}
              {tab === "products" && (
                <>
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Sản phẩm / SKU</th>
                          <th>Danh mục</th>
                          <th>Giá admin</th>
                          <th>Tồn kho admin</th>
                          <th>Trạng thái</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {slice(foundProducts).map((p) => {
                          const v = data.overrides[p.id] ?? {
                            price: p.price,
                            stock: p.stock,
                            active: true,
                          };
                          return (
                            <tr key={p.id}>
                              <td>
                                <strong className="block max-w-72">
                                  {p.title}
                                </strong>
                                <small>{p.id}</small>
                              </td>
                              <td className="text-xs">
                                {
                                  CATEGORIES.find((c) => c.id === p.categoryId)
                                    ?.name
                                }
                              </td>
                              <td className="whitespace-nowrap font-semibold">
                                {money(v.price)}
                              </td>
                              <td
                                className={v.stock < 10 ? "text-amber-600" : ""}
                              >
                                {v.stock}
                              </td>
                              <td>
                                <span
                                  className={`admin-badge ${v.active ? "status-completed" : "status-cancelled"}`}
                                >
                                  {v.active ? "Đang kinh doanh" : "Tạm ngưng"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="admin-action"
                                  onClick={() =>
                                    open({ kind: "product", id: p.id })
                                  }
                                >
                                  Chỉnh sửa
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!foundProducts.length && <Empty />}
                  </div>
                  {pager(foundProducts.length)}
                  <p className="admin-footnote">
                    Giá và tồn kho tại đây là dữ liệu admin demo; chưa đồng bộ
                    với catalog và checkout cửa hàng.
                  </p>
                </>
              )}
              {tab === "customers" && (
                <>
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Khách hàng</th>
                          <th>Số điện thoại</th>
                          <th>Số đơn</th>
                          <th>Đã chi tiêu</th>
                          <th>Điểm thưởng</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {slice(foundCustomers).map((c) => (
                          <tr key={c.phone}>
                            <td>
                              <strong>{c.name}</strong>
                              <small>{c.email || "Chưa có email"}</small>
                            </td>
                            <td>{c.phone}</td>
                            <td>{c.orders}</td>
                            <td className="whitespace-nowrap font-semibold">
                              {money(c.spent)}
                            </td>
                            <td>
                              <span className="admin-badge status-shipping items-center gap-1.5">
                                <FaStar
                                  aria-hidden="true"
                                  className="h-2.5 w-2.5"
                                />
                                {c.points}
                              </span>
                            </td>
                            <td>
                              <button
                                className="admin-action"
                                onClick={() =>
                                  open({ kind: "customer", value: c })
                                }
                              >
                                Hồ sơ
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!foundCustomers.length && <Empty />}
                  </div>
                  {pager(foundCustomers.length)}
                  <p className="admin-footnote">
                    Mỗi số điện thoại là một hồ sơ. Tích 1 điểm / 10.000đ tiền
                    hàng sau giảm giá của đơn hoàn tất, làm tròn xuống theo từng
                    đơn.
                  </p>
                </>
              )}
            </section>
          )}
          <footer className="mt-8 flex justify-between text-[10px] text-muted">
            <span>© MEN / DAILY · Quản trị cửa hàng</span>
            <span>Dữ liệu mẫu tháng 10/2026</span>
          </footer>
        </main>
      </div>
      {modal && (
        <div
          className="admin-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            className="admin-modal"
            onKeyDown={(e) => {
              if (e.key === "Escape") setModal(null);
              if (e.key === "Tab") {
                const controls = e.currentTarget.querySelectorAll<HTMLElement>(
                  "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
                );
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="admin-modal-title" className="text-lg font-bold">
                {modal.kind === "order"
                  ? "Chi tiết đơn hàng"
                  : modal.kind === "product"
                    ? "Chỉnh sửa sản phẩm"
                    : modal.kind === "employee"
                      ? "Thông tin nhân viên"
                      : "Hồ sơ khách hàng"}
              </h2>
              <button
                autoFocus
                className="rounded px-3 py-1 text-xl hover:bg-slate-100"
                onClick={() => setModal(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <form className="space-y-4" onSubmit={submit}>
              {(modal.kind === "employee" || modal.kind === "customer") && (
                <>
                  <label className="admin-label">
                    Họ và tên
                    <input
                      name="name"
                      required
                      maxLength={100}
                      className="field"
                      defaultValue={modal.value?.name}
                    />
                  </label>
                  <label className="admin-label">
                    Số điện thoại
                    <input
                      name="phone"
                      type="tel"
                      required
                      className="field"
                      readOnly={modal.kind === "customer" && !!modal.value}
                      defaultValue={modal.value?.phone}
                    />
                  </label>
                  {modal.kind === "employee" ? (
                    <>
                      <label className="admin-label">
                        Chức vụ
                        <input
                          name="role"
                          required
                          maxLength={100}
                          className="field"
                          defaultValue={modal.value?.role ?? "Tư vấn bán hàng"}
                        />
                      </label>
                      <label className="admin-label">
                        Mục tiêu doanh số (đ)
                        <input
                          name="target"
                          required
                          type="number"
                          min="0"
                          max="1000000000000"
                          step="1000"
                          className="field"
                          defaultValue={modal.value?.target ?? 10000000}
                        />
                      </label>
                      <label className="admin-label">
                        Trạng thái
                        <select
                          name="active"
                          className="field"
                          defaultValue={String(modal.value?.active ?? true)}
                        >
                          <option value="true">Đang làm việc</option>
                          <option value="false">Tạm nghỉ</option>
                        </select>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="admin-label">
                        Email
                        <input
                          name="email"
                          type="email"
                          className="field"
                          defaultValue={modal.value?.email}
                        />
                      </label>
                      <label className="admin-label">
                        Địa chỉ
                        <textarea
                          name="address"
                          maxLength={500}
                          className="field"
                          defaultValue={modal.value?.address}
                        />
                      </label>
                      {modal.value && (
                        <p className="rounded-xl bg-blue-50 p-4 text-sm text-brand">
                          Điểm hiện có:{" "}
                          <strong>
                            {customers.find(
                              (c) => c.phone === modal.value?.phone,
                            )?.points ?? 0}
                          </strong>{" "}
                          · Tự tính từ đơn hoàn tất
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
              {selectedProduct && (
                <>
                  <p className="text-sm font-semibold">
                    {selectedProduct.title}
                  </p>
                  <label className="admin-label">
                    Giá admin (đ)
                    <input
                      name="price"
                      className="field"
                      required
                      type="number"
                      min="1"
                      max="1000000000"
                      step="1"
                      defaultValue={
                        data.overrides[selectedProduct.id]?.price ??
                        selectedProduct.price
                      }
                    />
                  </label>
                  <label className="admin-label">
                    Tồn kho admin
                    <input
                      name="stock"
                      className="field"
                      required
                      type="number"
                      min="0"
                      max="1000000"
                      step="1"
                      defaultValue={
                        data.overrides[selectedProduct.id]?.stock ??
                        selectedProduct.stock
                      }
                    />
                  </label>
                  <label className="admin-label">
                    Trạng thái
                    <select
                      name="active"
                      className="field"
                      defaultValue={String(
                        data.overrides[selectedProduct.id]?.active ?? true,
                      )}
                    >
                      <option value="true">Đang kinh doanh</option>
                      <option value="false">Tạm ngưng</option>
                    </select>
                  </label>
                  <p className="text-xs text-muted">
                    Chỉ cập nhật catalog quản trị demo trên trình duyệt này.
                  </p>
                </>
              )}
              {selectedOrder && (
                <>
                  <div className="flex justify-between text-sm">
                    <strong className="text-brand">{selectedOrder.id}</strong>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-sm">
                    <strong>
                      {selectedOrder.customer.name} ·{" "}
                      {selectedOrder.customer.phone}
                    </strong>
                    <p className="mt-2 text-muted">
                      {selectedOrder.customer.address}
                    </p>
                  </div>
                  {selectedOrder.items.map((i, n) => (
                    <div
                      key={n}
                      className="flex justify-between gap-4 border-b border-line pb-3 text-sm"
                    >
                      <span>
                        {i.title}
                        <small className="mt-1 block text-muted">
                          {i.quantity} × {money(i.price)}
                        </small>
                      </span>
                      <strong className="whitespace-nowrap">
                        {money(i.quantity * i.price)}
                      </strong>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span>Tiền hàng sau giảm giá</span>
                    <strong>{money(selectedOrder.merchandise)}</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Phí giao hàng sau giảm</span>
                    <strong>
                      {money(selectedOrder.total - selectedOrder.merchandise)}
                    </strong>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Tổng thanh toán</span>
                    <span className="text-brand">
                      {money(selectedOrder.total)}
                    </span>
                  </div>
                  <label className="admin-label">
                    Nhân viên phụ trách
                    <select
                      name="employee"
                      className="field"
                      defaultValue={selectedOrder.employeeId}
                    >
                      <option value="">Chưa phân công</option>
                      {data.employees
                        .filter(
                          (e) => e.active || e.id === selectedOrder.employeeId,
                        )
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="admin-label">
                    Trạng thái đơn
                    <select
                      name="status"
                      className="field"
                      defaultValue={selectedOrder.status}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-xs leading-relaxed text-muted">
                    Đơn hoàn tất ghi nhận doanh số và điểm. Chuyển sang hủy sẽ
                    loại khỏi cả hai. Thao tác mô phỏng, không xác nhận thanh
                    toán ngân hàng.
                  </p>
                </>
              )}
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModal(null)}
                >
                  Đóng
                </button>
                <button className="btn-primary" type="submit">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function Empty() {
  return (
    <p className="py-16 text-center text-sm text-muted">
      Không có dữ liệu phù hợp. Thử thay đổi bộ lọc hoặc từ khóa.
    </p>
  );
}
