"use client";

import { CATEGORIES } from "@/data/categories";

interface CategoryGridProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryGrid({ selectedId, onSelect }: CategoryGridProps) {
  return (
    <section aria-labelledby="danh-muc-heading" className="rounded-lg bg-surface p-4">
      <h2 id="danh-muc-heading" className="mb-3 text-lg font-semibold">
        Khám phá danh mục
      </h2>
      <ul className="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-8">
        {CATEGORIES.map((c) => {
          const active = c.id === selectedId;
          return (
            <li key={c.id} className="min-w-0">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(active ? null : c.id)}
                className={`flex w-full flex-col items-center gap-1.5 rounded-lg p-2 text-center text-xs transition sm:text-sm ${
                  active ? "bg-brand/25 ring-2 ring-brand" : "hover:bg-background"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-2xl sm:h-14 sm:w-14"
                >
                  {c.icon}
                </span>
                <span className="w-full break-words leading-tight">{c.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
