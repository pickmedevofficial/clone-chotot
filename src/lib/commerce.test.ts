import { describe, expect, it, vi } from "vitest";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import {
  calculateTotals,
  parseCart,
  setCartQuantity,
  validateBuyer,
  createOrder,
  persistOrder,
  buildVietQrUrl,
  parseOrders,
} from "./commerce";

const buyer = {
  name: "Nguyễn Văn Nam",
  phone: "0912345678",
  email: "",
  province: "Hà Nội",
  district: "Cầu Giấy",
  ward: "Dịch Vọng",
  address: "12 Trần Thái Tông",
  note: "",
};

describe("catalog", () => {
  it("có 50 SKU hợp lệ trong từng danh mục, không trùng ID/tên", () => {
    expect(PRODUCTS).toHaveLength(400);
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(400);
    expect(new Set(PRODUCTS.map((p) => p.title)).size).toBe(400);
    for (const category of CATEGORIES)
      expect(PRODUCTS.filter((p) => p.categoryId === category.id)).toHaveLength(
        50,
      );
    expect(
      PRODUCTS.every(
        (p) =>
          p.price > 0 &&
          Number.isSafeInteger(p.price) &&
          p.brand &&
          p.stock >= 20,
      ),
    ).toBe(true);
  });
});

describe("cart", () => {
  it("bỏ JSON hỏng, SKU lạ, số lượng không hợp lệ; gộp trùng và giới hạn 20", () => {
    const id = PRODUCTS[0].id;
    expect(parseCart("bad")).toEqual([]);
    expect(parseCart('{"x":1}')).toEqual([]);
    expect(
      parseCart(
        JSON.stringify([
          { productId: id, quantity: 18 },
          { productId: id, quantity: 9 },
          { productId: "gone", quantity: 1 },
          { productId: PRODUCTS[1].id, quantity: -1 },
        ]),
      ),
    ).toEqual([{ productId: id, quantity: 20 }]);
  });
  it("thêm, sửa, xóa và từ chối số lượng lẻ/NaN", () => {
    const id = PRODUCTS[0].id;
    const cart = setCartQuantity([], id, 2);
    expect(cart).toEqual([{ productId: id, quantity: 2 }]);
    expect(setCartQuantity(cart, id, 30)[0].quantity).toBe(20);
    expect(setCartQuantity(cart, id, 0)).toEqual([]);
    expect(setCartQuantity(cart, id, NaN)).toEqual(cart);
    expect(setCartQuantity(cart, id, 1.5)).toEqual(cart);
  });
});

describe("totals", () => {
  it.each([
    [199_000, "standard", "HELLO10", 0, 30_000, 229_000, true],
    [200_000, "standard", " hello10 ", 20_000, 30_000, 210_000, false],
    [1_200_000, "express", "HELLO10", 100_000, 50_000, 1_150_000, false],
    [499_000, "standard", "", 0, 0, 499_000, false],
    [500_000, "standard", "MEN50", 50_000, 0, 450_000, false],
    [299_000, "express", "FREESHIP", 0, 20_000, 319_000, false],
    [300_000, "standard", "NOPE", 0, 30_000, 330_000, true],
  ] as const)(
    "%i / %s / %s tính đúng tổng",
    (subtotal, shipping, voucher, discount, shippingTotal, total, error) => {
      const result = calculateTotals(subtotal, shipping, voucher);
      expect(result.discount).toBe(discount);
      expect(result.shippingTotal).toBe(shippingTotal);
      expect(result.total).toBe(total);
      expect(Boolean(result.voucherError)).toBe(error);
    },
  );
  it("giỏ rỗng không chịu phí ship", () => {
    expect(calculateTotals(0, "standard", "").total).toBe(0);
  });
});

describe("orders", () => {
  it("tạo đơn trên trình duyệt không có crypto.randomUUID", () => {
    vi.stubGlobal("crypto", undefined);
    try {
      const order = createOrder(
        [{ productId: PRODUCTS[0].id, quantity: 1 }],
        buyer,
        "standard",
        "cod",
        "",
      );
      expect(order.id).toMatch(/^MD[A-Z0-9]+$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("bỏ snapshot sai tổng tiền nhưng giữ đơn còn hợp lệ", () => {
    const order = createOrder(
      [{ productId: PRODUCTS[0].id, quantity: 1 }],
      buyer,
      "standard",
      "cod",
      "",
    );
    const broken = {
      ...order,
      totals: { ...order.totals, subtotal: 100, total: 30100 },
    };
    expect(parseOrders(JSON.stringify([broken, order]))).toEqual([order]);
  });
  it("yêu cầu tên, SĐT Việt Nam, đủ địa chỉ và email đúng nếu có", () => {
    expect(validateBuyer(buyer)).toEqual({});
    expect(
      validateBuyer({
        ...buyer,
        name: " ",
        phone: "123",
        ward: "",
        email: "bad",
      }),
    ).toMatchObject({
      name: expect.any(String),
      phone: expect.any(String),
      ward: expect.any(String),
      email: expect.any(String),
    });
    expect(validateBuyer({ ...buyer, phone: "+84 912 345 678" })).toEqual({});
  });
  it("chụp lại giá và người nhận; ngân hàng luôn chờ thanh toán", () => {
    const order = createOrder(
      [{ productId: PRODUCTS[0].id, quantity: 2 }],
      buyer,
      "standard",
      "bank",
      "",
      new Date("2026-10-17T10:00:00Z"),
    );
    expect(order.items[0].quantity).toBe(2);
    expect(order.items[0].unitPrice).toBe(PRODUCTS[0].price);
    expect(order.totals.subtotal).toBe(PRODUCTS[0].price * 2);
    expect(order.status).toBe("awaiting-payment");
    expect(order.buyer).not.toBe(buyer);
    expect(order.id).toMatch(/^MD/);
  });
  it("không tạo đơn rỗng, người nhận sai hoặc voucher không hợp lệ", () => {
    expect(() => createOrder([], buyer, "standard", "cod", "")).toThrow();
    expect(() =>
      createOrder(
        [{ productId: PRODUCTS[0].id, quantity: 1 }],
        { ...buyer, phone: "" },
        "standard",
        "cod",
        "",
      ),
    ).toThrow();
    expect(() =>
      createOrder(
        [{ productId: PRODUCTS[0].id, quantity: 1 }],
        buyer,
        "standard",
        "cod",
        "NOPE",
      ),
    ).toThrow();
  });
  it("storage đầy phải trả thất bại, không xóa giỏ", () => {
    const data = new Map<string, string>([["mendaily:cart:v1", "keep-me"]]);
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    const order = createOrder(
      [{ productId: PRODUCTS[0].id, quantity: 1 }],
      buyer,
      "standard",
      "cod",
      "",
    );
    expect(persistOrder(order, storage).ok).toBe(false);
    expect(data.get("mendaily:cart:v1")).toBe("keep-me");
  });
  it("lưu snapshot đơn, retry cùng ID không tạo đơn trùng", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
    const order = createOrder(
      [{ productId: PRODUCTS[0].id, quantity: 1 }],
      buyer,
      "standard",
      "cod",
      "",
    );
    expect(persistOrder(order, storage).ok).toBe(true);
    expect(persistOrder(order, storage).ok).toBe(true);
    const saved = JSON.parse(data.get("mendaily:orders:v1")!);
    expect(saved).toHaveLength(1);
    expect(saved[0].buyer.address).toBe("12 Trần Thái Tông");
  });
  it("không tạo QR ngân hàng thiếu cấu hình, URL đúng số tiền và nội dung khi có", () => {
    expect(
      buildVietQrUrl({ bank: "", account: "", name: "" }, 123_000, "MD123"),
    ).toBeNull();
    const url = buildVietQrUrl(
      { bank: "970436", account: "123456789", name: "NGUYEN VAN NAM" },
      123_000,
      "MD123",
    );
    expect(url).toContain("970436-123456789-compact2.png");
    expect(new URL(url!).searchParams.get("amount")).toBe("123000");
    expect(new URL(url!).searchParams.get("addInfo")).toBe("MD123");
  });
});
