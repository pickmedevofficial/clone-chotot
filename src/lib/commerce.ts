import { PRODUCT_MAP } from "@/data/products";
import type {
  Buyer,
  CartItem,
  CartLine,
  Order,
  OrderTotals,
  PaymentMethod,
  ShippingMethod,
} from "@/types/shop";

export const CART_KEY = "mendaily:cart:v1";
export const ORDERS_KEY = "mendaily:orders:v1";
export const MAX_QUANTITY = 20;
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type WriteResult = { ok: true } | { ok: false; error: string };
export const VOUCHERS = [
  {
    code: "HELLO10",
    label: "Giảm 10%",
    detail: "Đơn từ 200.000đ · tối đa 100.000đ",
  },
  { code: "MEN50", label: "Giảm 50.000đ", detail: "Đơn từ 500.000đ" },
  {
    code: "FREESHIP",
    label: "Giảm phí ship",
    detail: "Đơn từ 299.000đ · tối đa 30.000đ",
  },
];

export function parseCart(raw: string | null): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const quantities = new Map<string, number>();
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const { productId, quantity } = entry;
      if (
        typeof productId !== "string" ||
        !PRODUCT_MAP.has(productId) ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
      )
        continue;
      quantities.set(
        productId,
        Math.min(MAX_QUANTITY, (quantities.get(productId) ?? 0) + quantity),
      );
    }
    return [...quantities].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  } catch {
    return [];
  }
}

export function setCartQuantity(
  cart: CartItem[],
  productId: string,
  quantity: number,
): CartItem[] {
  if (
    !PRODUCT_MAP.has(productId) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0
  )
    return cart;
  const remaining = cart.filter((item) => item.productId !== productId);
  if (quantity === 0) return remaining;
  const entry = { productId, quantity: Math.min(MAX_QUANTITY, quantity) };
  return cart.some((item) => item.productId === productId)
    ? cart.map((item) => (item.productId === productId ? entry : item))
    : [...remaining, entry];
}

export function resolveCart(cart: CartItem[]): CartLine[] {
  return parseCart(JSON.stringify(cart)).flatMap((item) => {
    const product = PRODUCT_MAP.get(item.productId);
    return product
      ? [{ ...item, product, lineTotal: product.price * item.quantity }]
      : [];
  });
}

export function calculateTotals(
  subtotal: number,
  shipping: ShippingMethod,
  code: string,
): OrderTotals {
  subtotal = Number.isSafeInteger(subtotal) && subtotal > 0 ? subtotal : 0;
  const voucher = code.trim().toUpperCase();
  const shippingFee = !subtotal
    ? 0
    : shipping === "express"
      ? 50000
      : subtotal >= 499000
        ? 0
        : 30000;
  let discount = 0;
  let shippingDiscount = 0;
  let voucherError: string | null = null;
  if (voucher === "HELLO10") {
    if (subtotal < 200000) voucherError = "HELLO10 áp dụng cho đơn từ 200.000đ";
    else discount = Math.min(Math.round(subtotal * 0.1), 100000);
  } else if (voucher === "MEN50") {
    if (subtotal < 500000) voucherError = "MEN50 áp dụng cho đơn từ 500.000đ";
    else discount = 50000;
  } else if (voucher === "FREESHIP") {
    if (subtotal < 299000)
      voucherError = "FREESHIP áp dụng cho đơn từ 299.000đ";
    else shippingDiscount = Math.min(shippingFee, 30000);
  } else if (voucher) voucherError = "Mã ưu đãi không hợp lệ";
  return {
    subtotal,
    discount,
    shippingFee,
    shippingDiscount,
    shippingTotal: shippingFee - shippingDiscount,
    total: subtotal - discount + shippingFee - shippingDiscount,
    voucher: voucherError ? "" : voucher,
    voucherError,
  };
}

export function validateBuyer(
  buyer: Buyer,
): Partial<Record<keyof Buyer, string>> {
  const errors: Partial<Record<keyof Buyer, string>> = {};
  if (buyer.name.trim().length < 2 || buyer.name.length > 100)
    errors.name = "Nhập họ tên từ 2–100 ký tự";
  const phone = buyer.phone.replace(/[\s.()-]/g, "");
  if (!/^(?:0|\+84)[35789]\d{8}$/.test(phone))
    errors.phone = "Nhập số điện thoại Việt Nam hợp lệ";
  if (buyer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim()))
    errors.email = "Email chưa đúng định dạng";
  for (const key of ["province", "district", "ward", "address"] as const) {
    if (!buyer[key].trim() || buyer[key].length > 250)
      errors[key] = "Nhập đầy đủ thông tin (tối đa 250 ký tự)";
  }
  if (buyer.note.length > 500) errors.note = "Ghi chú tối đa 500 ký tự";
  return errors;
}

export function createOrder(
  cart: CartItem[],
  buyer: Buyer,
  shipping: ShippingMethod,
  payment: PaymentMethod,
  voucher: string,
  now = new Date(),
): Order {
  const lines = resolveCart(cart);
  if (!lines.length) throw new Error("Giỏ hàng đang trống");
  if (Object.keys(validateBuyer(buyer)).length)
    throw new Error("Vui lòng kiểm tra thông tin nhận hàng");
  if (
    !["standard", "express"].includes(shipping) ||
    !["cod", "bank"].includes(payment)
  )
    throw new Error("Chọn cách giao hàng và thanh toán hợp lệ");
  const totals = calculateTotals(
    lines.reduce((sum, l) => sum + l.lineTotal, 0),
    shipping,
    voucher,
  );
  if (totals.voucherError) throw new Error(totals.voucherError);
  const suffix = (
    globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 8) ??
    Math.random().toString(36).slice(2, 10).padEnd(8, "0")
  ).toUpperCase();
  return {
    id: `MD${now.getTime().toString(36).toUpperCase()}${suffix}`,
    createdAt: now.toISOString(),
    buyer: Object.fromEntries(
      Object.entries(buyer).map(([key, value]) => [key, value.trim()]),
    ) as unknown as Buyer,
    items: lines.map((line) => ({
      productId: line.productId,
      title: line.product.title,
      brand: line.product.brand,
      quantity: line.quantity,
      unitPrice: line.product.price,
      lineTotal: line.lineTotal,
    })),
    shipping,
    payment,
    status: payment === "bank" ? "awaiting-payment" : "pending-confirmation",
    totals,
  };
}

export function parseOrders(raw: string | null): Order[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((order): order is Order => {
      if (
        !order ||
        typeof order !== "object" ||
        typeof order.id !== "string" ||
        !/^MD[A-Z0-9]+$/.test(order.id) ||
        typeof order.createdAt !== "string" ||
        Number.isNaN(Date.parse(order.createdAt))
      )
        return false;
      if (
        !order.buyer ||
        ![
          "name",
          "phone",
          "email",
          "province",
          "district",
          "ward",
          "address",
          "note",
        ].every((k) => typeof order.buyer[k] === "string")
      )
        return false;
      if (
        !["cod", "bank"].includes(order.payment) ||
        !["standard", "express"].includes(order.shipping) ||
        !["awaiting-payment", "pending-confirmation"].includes(order.status)
      )
        return false;
      if (
        !Array.isArray(order.items) ||
        !order.items.length ||
        !order.items.every(
          (i: Record<string, unknown>) =>
            i &&
            typeof i.title === "string" &&
            typeof i.brand === "string" &&
            typeof i.productId === "string" &&
            Number.isSafeInteger(i.quantity) &&
            Number(i.quantity) > 0 &&
            Number.isSafeInteger(i.unitPrice) &&
            Number(i.unitPrice) > 0 &&
            i.lineTotal === Number(i.quantity) * Number(i.unitPrice),
        )
      )
        return false;
      const t = order.totals;
      return (
        !!t &&
        [
          "subtotal",
          "discount",
          "shippingFee",
          "shippingDiscount",
          "shippingTotal",
          "total",
        ].every((k) => Number.isSafeInteger(t[k]) && t[k] >= 0) &&
        t.subtotal ===
          order.items.reduce(
            (sum: number, item: { lineTotal: number }) => sum + item.lineTotal,
            0,
          ) &&
        t.discount <= t.subtotal &&
        t.shippingDiscount <= t.shippingFee &&
        t.shippingTotal === t.shippingFee - t.shippingDiscount &&
        t.total === t.subtotal - t.discount + t.shippingTotal &&
        typeof t.voucher === "string"
      );
    });
  } catch {
    return [];
  }
}

export function writeStorage(
  storage: StorageLike | null,
  key: string,
  value: unknown,
): WriteResult {
  try {
    if (!storage) throw new Error("unavailable");
    storage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn. Giỏ hàng của bạn vẫn được giữ nguyên.",
    };
  }
}

export function persistOrder(
  order: Order,
  storage: StorageLike | null,
): WriteResult {
  try {
    const orders = parseOrders(storage?.getItem(ORDERS_KEY) ?? null);
    return writeStorage(storage, ORDERS_KEY, [
      order,
      ...orders.filter((o) => o.id !== order.id),
    ]);
  } catch {
    return {
      ok: false,
      error:
        "Không thể lưu đơn hàng. Vui lòng kiểm tra quyền lưu trữ của trình duyệt.",
    };
  }
}

export interface BankConfig {
  bank: string;
  account: string;
  name: string;
}
export function buildVietQrUrl(
  config: BankConfig,
  amount: number,
  orderId: string,
): string | null {
  if (
    !/^[a-zA-Z0-9]+$/.test(config.bank) ||
    !/^\d{4,30}$/.test(config.account) ||
    !config.name.trim() ||
    !Number.isSafeInteger(amount) ||
    amount <= 0
  )
    return null;
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: orderId,
    accountName: config.name.trim(),
  });
  return `https://img.vietqr.io/image/${config.bank}-${config.account}-compact2.png?${query}`;
}
