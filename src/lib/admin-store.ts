"use client";
import { useSyncExternalStore } from "react";
import { PRODUCT_MAP } from "@/data/products";
import { seedAdmin, type AdminData, type CustomSibling } from "@/lib/admin";

export function syncCustomSiblingsToProductMap(
  customSiblings?: Record<string, CustomSibling[]>,
) {
  if (!customSiblings) return;
  for (const list of Object.values(customSiblings)) {
    for (const sib of list) {
      PRODUCT_MAP.set(sib.id, {
        ...sib,
      });
    }
  }
}

// Kho dữ liệu admin demo dùng chung cho /admin và các trang con (lưu localStorage).
export const ADMIN_KEY = "mendaily:admin:v1";
export const adminSeed = seedAdmin();
let rawCache: string | null | undefined;
let cache = adminSeed;
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
    const raw = localStorage.getItem(ADMIN_KEY);
    if (raw !== rawCache) {
      rawCache = raw;
      const d = raw ? JSON.parse(raw) : adminSeed;
      cache =
        d &&
        Array.isArray(d.employees) &&
        Array.isArray(d.customers) &&
        Array.isArray(d.orders) &&
        d.overrides &&
        d.orderUpdates
          ? d
          : adminSeed;
      if (cache.customSiblings) {
        syncCustomSiblingsToProductMap(cache.customSiblings);
      }
    }
  } catch {
    cache = adminSeed;
  }
  return cache;
}
export function useAdminData(): AdminData {
  return useSyncExternalStore(subscribe, snapshot, () => adminSeed);
}
/** Ghi dữ liệu admin; ném lỗi nếu trình duyệt không cho lưu. */
export function writeAdmin(next: AdminData) {
  if (next.customSiblings) {
    syncCustomSiblingsToProductMap(next.customSiblings);
  }
  localStorage.setItem(ADMIN_KEY, JSON.stringify(next));
  listeners.forEach((fn) => fn());
}
