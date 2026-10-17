"use client";

import { useSyncExternalStore } from "react";
import {
  CART_KEY,
  ORDERS_KEY,
  MAX_QUANTITY,
  parseCart,
  parseOrders,
  persistOrder,
  setCartQuantity,
  writeStorage,
  type WriteResult,
} from "./commerce";
import type { CartItem, Order } from "@/types/shop";

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  const handle = (event: StorageEvent) => {
    if (!event.key || event.key === CART_KEY || event.key === ORDERS_KEY) fn();
  };
  window.addEventListener("storage", handle);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", handle);
  };
}
function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
function read(key: string) {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

const emptyCart: CartItem[] = [];
let cartRaw: string | null | undefined;
let cachedCart = emptyCart;
function cartSnapshot() {
  const raw = read(CART_KEY);
  if (raw !== cartRaw) {
    cartRaw = raw;
    cachedCart = parseCart(raw);
  }
  return cachedCart;
}
export function useCart() {
  return useSyncExternalStore(subscribe, cartSnapshot, () => emptyCart);
}
const emptyOrders: Order[] = [];
let ordersRaw: string | null | undefined;
let cachedOrders = emptyOrders;
function orderSnapshot() {
  const raw = read(ORDERS_KEY);
  if (raw !== ordersRaw) {
    ordersRaw = raw;
    cachedOrders = parseOrders(raw);
  }
  return cachedOrders;
}
export function useOrders() {
  return useSyncExternalStore(subscribe, orderSnapshot, () => emptyOrders);
}
const noopSubscribe = () => () => {};
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function updateQuantity(
  productId: string,
  quantity: number,
): WriteResult {
  const next = setCartQuantity(cartSnapshot(), productId, quantity);
  const result = writeStorage(storage(), CART_KEY, next);
  if (result.ok) emit();
  return result;
}
export function addToCart(productId: string, quantity = 1): WriteResult {
  const current =
    cartSnapshot().find((i) => i.productId === productId)?.quantity ?? 0;
  if (current + quantity > MAX_QUANTITY)
    return {
      ok: false,
      error: `Mỗi sản phẩm được mua tối đa ${MAX_QUANTITY} đơn vị.`,
    };
  return updateQuantity(productId, current + quantity);
}
export function submitOrder(
  order: Order,
): WriteResult & { cartWarning?: string } {
  const result = persistOrder(order, storage());
  if (!result.ok) return result;
  const cleared = writeStorage(storage(), CART_KEY, []);
  emit();
  return {
    ok: true,
    cartWarning: cleared.ok
      ? undefined
      : "Đã lưu đơn nhưng chưa thể dọn giỏ hàng.",
  };
}
