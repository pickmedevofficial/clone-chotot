"use client";
import { CATEGORIES } from "@/data/categories";
export default function CategoryGrid({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <section
      aria-labelledby="category-heading"
      className="rounded-2xl border border-blue-200 bg-blue-50 p-3 shadow-sm shadow-blue-950/5 sm:rounded-3xl sm:p-6"
    >
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:items-end sm:gap-3">
        <div>
          <p className="eyebrow mb-2 hidden text-brand sm:block">
            YOUR DAILY ROUTINE
          </p>
          <h2 id="category-heading" className="text-base font-bold sm:text-2xl">
            <span className="sm:hidden">Danh mục sản phẩm</span>
            <span className="hidden sm:inline">
              Bạn cần chăm sóc gì hôm nay?
            </span>
          </h2>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="shrink-0 py-1 text-[10px] font-semibold text-brand sm:text-xs"
        >
          Tất cả danh mục ↗
        </button>
      </div>
      <ul className="grid grid-cols-4 gap-2 md:grid-cols-8 md:gap-3">
        {CATEGORIES.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(selectedId === c.id ? null : c.id)}
              aria-pressed={selectedId === c.id}
              className={`group flex h-full w-full flex-col items-center rounded-xl border-2 px-1 py-1.5 shadow-sm transition hover:shadow-md sm:rounded-2xl sm:py-5 sm:hover:-translate-y-1 ${selectedId === c.id ? "border-brand bg-brand text-white shadow-blue-600/20 ring-2 ring-blue-300 ring-offset-2 ring-offset-blue-50" : "border-blue-200 bg-white hover:border-brand hover:bg-blue-100/60"}`}
            >
              <span
                aria-hidden="true"
                className={`mb-1 flex h-7 w-7 items-center justify-center rounded-lg text-xl transition sm:mb-3 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-3xl sm:group-hover:-translate-y-1 ${selectedId === c.id ? "bg-white/20" : "bg-blue-100"}`}
              >
                {c.icon}
              </span>
              <span className="flex min-h-7 items-center text-center text-[11px] font-bold leading-[13px] sm:min-h-0 sm:text-xs sm:leading-normal">
                {c.name}
              </span>
              <span
                className={`sr-only rounded-full text-[9px] font-semibold sm:not-sr-only sm:mt-2 sm:px-2 sm:py-1 ${selectedId === c.id ? "bg-white/15 text-blue-50" : "bg-blue-50 text-blue-700"}`}
              >
                50 lựa chọn
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
