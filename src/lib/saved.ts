import { useSyncExternalStore } from "react";

export const SAVED_STORAGE_KEY = "chomoi:saved";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(storage: StorageLike | null): string | null {
  try {
    return storage?.getItem(SAVED_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? [...new Set(parsed.filter((x): x is string => typeof x === "string"))] : [];
  } catch {
    return [];
  }
}

export function loadSavedIds(storage: StorageLike | null = defaultStorage()): string[] {
  return parseIds(readRaw(storage));
}

/** Lưu / bỏ lưu một tin. Trả về false nếu trình duyệt không cho ghi. */
export function toggleSaved(id: string, storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false;
  const ids = loadSavedIds(storage);
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
  try {
    storage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  emitChange();
  return true;
}

/* --------------------------------------------------------- external store */

const listeners = new Set<() => void>();

function emitChange() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === SAVED_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: string[] = [];
let cachedRaw: string | null | undefined;
let cachedIds: string[] = EMPTY;

function getSnapshot(): string[] {
  const raw = readRaw(defaultStorage());
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = parseIds(raw);
  }
  return cachedIds;
}

/** Id các tin đã lưu (mới lưu đứng đầu). Trên server luôn rỗng. */
export function useSavedIds(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
