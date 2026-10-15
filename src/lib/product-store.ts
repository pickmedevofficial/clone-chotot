import { useSyncExternalStore } from "react";
import { CATEGORIES } from "@/data/categories";
import { MOCK_PRODUCTS } from "@/data/mock-products";
import type { Product, ProductDraft } from "@/types/product";

export const STORAGE_KEY = "chomoi:user-products";
export const MAX_IMAGES = 6;
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const QUOTA_ERROR_MESSAGE = "Bộ nhớ trình duyệt đã đầy, hãy xóa bớt tin";
export const STORAGE_UNAVAILABLE_MESSAGE =
  "Không thể lưu tin vì trình duyệt không cho phép lưu trữ";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type ProductErrors = Partial<Record<keyof ProductDraft, string>>;

export type SaveResult = { ok: true; product: Product } | { ok: false; error: string };

/* ---------------------------------------------------------------- validate */

export function validateProduct(draft: ProductDraft): ProductErrors {
  const errors: ProductErrors = {};
  const title = draft.title?.trim() ?? "";
  if (!title) errors.title = "Vui lòng nhập tiêu đề";
  else if (title.length > MAX_TITLE_LENGTH)
    errors.title = `Tiêu đề tối đa ${MAX_TITLE_LENGTH} ký tự`;

  if (typeof draft.price !== "number" || !Number.isFinite(draft.price) || draft.price <= 0)
    errors.price = "Giá phải lớn hơn 0";
  else if (!Number.isInteger(draft.price)) errors.price = "Giá phải là số nguyên (đồng)";
  else if (!Number.isSafeInteger(draft.price)) errors.price = "Giá quá lớn";

  if (!draft.categoryId || !CATEGORIES.some((c) => c.id === draft.categoryId))
    errors.categoryId = "Vui lòng chọn danh mục";

  if (!draft.location?.trim()) errors.location = "Vui lòng chọn khu vực";

  if (draft.condition !== "moi" && draft.condition !== "da-su-dung")
    errors.condition = "Vui lòng chọn tình trạng";

  if ((draft.description?.trim().length ?? 0) > MAX_DESCRIPTION_LENGTH)
    errors.description = `Mô tả tối đa ${MAX_DESCRIPTION_LENGTH} ký tự`;

  const images = Array.isArray(draft.images) ? draft.images : [];
  if (images.length === 0) errors.images = "Vui lòng thêm ít nhất 1 ảnh";
  else if (images.length > MAX_IMAGES) errors.images = `Tối đa ${MAX_IMAGES} ảnh`;

  return errors;
}

/** Kiểm tra một file ảnh trước khi thêm vào form. Trả về thông báo lỗi hoặc null. */
export function validateImageFile(
  file: { type: string; size: number; name: string },
  currentCount: number,
): string | null {
  if (currentCount >= MAX_IMAGES) return `Tối đa ${MAX_IMAGES} ảnh cho mỗi tin`;
  if (!file.type.startsWith("image/")) return `"${file.name}" không phải là file ảnh`;
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" vượt quá 1MB`;
  return null;
}

/* ------------------------------------------------------------------ storage */

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Chỉ chấp nhận src mà next/image hiển thị được; src lạ có thể làm crash khi render. */
const SAFE_IMAGE_SRC = /^(https?:\/\/|data:image\/|\/)/;

function isStoredProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    p.id.length > 0 &&
    typeof p.title === "string" &&
    p.title.trim().length > 0 &&
    typeof p.price === "number" &&
    Number.isSafeInteger(p.price) &&
    p.price > 0 &&
    typeof p.categoryId === "string" &&
    CATEGORIES.some((c) => c.id === p.categoryId) &&
    typeof p.location === "string" &&
    typeof p.description === "string" &&
    Array.isArray(p.images) &&
    p.images.length > 0 &&
    p.images.every((i) => typeof i === "string" && SAFE_IMAGE_SRC.test(i)) &&
    (p.condition === "moi" || p.condition === "da-su-dung") &&
    typeof p.createdAt === "string" &&
    !Number.isNaN(Date.parse(p.createdAt))
  );
}

function readRaw(storage: StorageLike | null): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseUserProducts(raw: string | null): Product[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const item of parsed) {
    if (!isStoredProduct(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push({ ...item, source: "user" });
  }
  return result;
}

export function loadUserProducts(storage: StorageLike | null = defaultStorage()): Product[] {
  return parseUserProducts(readRaw(storage));
}

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: number };
  return (
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    e.code === 22 ||
    e.code === 1014
  );
}

function writeUserProducts(
  products: Product[],
  storage: StorageLike | null,
): { ok: true } | { ok: false; error: string } {
  if (!storage) return { ok: false, error: STORAGE_UNAVAILABLE_MESSAGE };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    return {
      ok: false,
      error: isQuotaError(err) ? QUOTA_ERROR_MESSAGE : STORAGE_UNAVAILABLE_MESSAGE,
    };
  }
  emitChange();
  return { ok: true };
}

function createId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
      return `u-${crypto.randomUUID()}`;
  } catch {
    /* ignore */
  }
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Validate rồi lưu tin mới lên đầu danh sách. Nếu ghi thất bại (ví dụ hết quota),
 * dữ liệu cũ trong storage được giữ nguyên.
 */
export function saveUserProduct(
  draft: ProductDraft,
  storage: StorageLike | null = defaultStorage(),
  now: Date = new Date(),
): SaveResult {
  const errors = validateProduct(draft);
  if (Object.keys(errors).length > 0)
    return { ok: false, error: "Vui lòng kiểm tra lại thông tin tin đăng" };

  const product: Product = {
    id: createId(),
    title: draft.title.trim(),
    price: draft.price,
    categoryId: draft.categoryId,
    location: draft.location.trim(),
    description: draft.description.trim(),
    images: [...draft.images],
    condition: draft.condition,
    createdAt: now.toISOString(),
    source: "user",
  };
  const result = writeUserProducts([product, ...loadUserProducts(storage)], storage);
  return result.ok ? { ok: true, product } : result;
}

export function deleteUserProduct(
  id: string,
  storage: StorageLike | null = defaultStorage(),
): { ok: true } | { ok: false; error: string } {
  const remaining = loadUserProducts(storage).filter((p) => p.id !== id);
  return writeUserProducts(remaining, storage);
}

function byNewest(a: Product, b: Product): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

/** Gộp mock + tin người dùng, sắp xếp theo createdAt giảm dần. */
export function getAllProducts(userProducts: Product[] = loadUserProducts()): Product[] {
  const mockIds = new Set(MOCK_PRODUCTS.map((p) => p.id));
  const user = userProducts.filter((p) => !mockIds.has(p.id));
  return [...user, ...MOCK_PRODUCTS].sort(byNewest);
}

/** Tìm tin theo id; trả về undefined nếu không tồn tại. */
export function findProduct(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/* --------------------------------------------------------- external store */

const listeners = new Set<() => void>();

function emitChange() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

const SERVER_SNAPSHOT: Product[] = getAllProducts([]);
let cachedRaw: string | null | undefined;
let cachedSnapshot: Product[] = SERVER_SNAPSHOT;

function getSnapshot(): Product[] {
  const raw = readRaw(defaultStorage());
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = getAllProducts(parseUserProducts(raw));
  }
  return cachedSnapshot;
}

function getServerSnapshot(): Product[] {
  return SERVER_SNAPSHOT;
}

/** Danh sách sản phẩm (mock + user). Trên server/hydration chỉ trả mock data. */
export function useProducts(): Product[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noopSubscribe = () => () => {};

/** true sau khi đã hydrate trên client (lúc đó useProducts đã có tin của người dùng). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
