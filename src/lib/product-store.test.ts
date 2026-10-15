import { beforeEach, describe, expect, it } from "vitest";
import { MOCK_PRODUCTS } from "@/data/mock-products";
import type { ProductDraft } from "@/types/product";
import {
  MAX_IMAGE_BYTES,
  QUOTA_ERROR_MESSAGE,
  STORAGE_KEY,
  deleteUserProduct,
  findProduct,
  getAllProducts,
  loadUserProducts,
  saveUserProduct,
  validateImageFile,
  validateProduct,
} from "./product-store";

class MemoryStorage {
  data = new Map<string, string>();
  quotaBytes = Infinity;
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (value.length > this.quotaBytes) {
      const err = new Error("quota");
      err.name = "QuotaExceededError";
      throw err;
    }
    this.data.set(key, value);
  }
}

const validDraft = (over: Partial<ProductDraft> = {}): ProductDraft => ({
  title: "Bàn làm việc gỗ",
  price: 1_500_000,
  categoryId: "do-gia-dung",
  location: "Hà Nội",
  description: "Còn mới",
  images: ["data:image/png;base64,AAAA"],
  condition: "da-su-dung",
  ...over,
});

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
});

describe("validateProduct", () => {
  it("chấp nhận tin hợp lệ với 1–6 ảnh", () => {
    expect(validateProduct(validDraft())).toEqual({});
    expect(validateProduct(validDraft({ images: Array(6).fill("data:x") }))).toEqual({});
  });

  it("báo lỗi từng trường khi thiếu tiêu đề, giá ≤ 0, không chọn danh mục", () => {
    const errors = validateProduct(validDraft({ title: "   ", price: 0, categoryId: "" }));
    expect(errors.title).toBeTruthy();
    expect(errors.price).toBeTruthy();
    expect(errors.categoryId).toBeTruthy();
    expect(validateProduct(validDraft({ price: -5 })).price).toBeTruthy();
    expect(validateProduct(validDraft({ price: Number.NaN })).price).toBeTruthy();
  });

  it("báo lỗi khi không có ảnh hoặc quá 6 ảnh", () => {
    expect(validateProduct(validDraft({ images: [] })).images).toBeTruthy();
    expect(validateProduct(validDraft({ images: Array(7).fill("data:x") })).images).toBeTruthy();
  });
});

describe("validateImageFile", () => {
  it("nhận ảnh ≤ 1MB", () => {
    expect(validateImageFile({ name: "a.png", type: "image/png", size: MAX_IMAGE_BYTES }, 0)).toBeNull();
  });
  it("từ chối file không phải ảnh, > 1MB, hoặc vượt 6 ảnh", () => {
    expect(validateImageFile({ name: "a.pdf", type: "application/pdf", size: 10 }, 0)).toMatch(/không phải/);
    expect(validateImageFile({ name: "a.jpg", type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 }, 0)).toMatch(/1MB/);
    expect(validateImageFile({ name: "a.jpg", type: "image/jpeg", size: 10 }, 6)).toMatch(/6 ảnh/);
  });
});

describe("saveUserProduct / loadUserProducts / deleteUserProduct", () => {
  it("lưu tin hợp lệ và tin mới nằm đầu danh sách 'Mới nhất'", () => {
    const res = saveUserProduct(validDraft(), storage, new Date("2026-10-15T00:00:00Z"));
    expect(res.ok).toBe(true);
    const stored = loadUserProducts(storage);
    expect(stored).toHaveLength(1);
    expect(stored[0].source).toBe("user");
    const all = getAllProducts(stored);
    expect(all[0].id).toBe(stored[0].id);
    expect(all).toHaveLength(MOCK_PRODUCTS.length + 1);
  });

  it("không lưu tin thiếu trường", () => {
    const res = saveUserProduct(validDraft({ title: "" }), storage);
    expect(res.ok).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("khi hết quota: trả lỗi và giữ nguyên dữ liệu cũ", () => {
    expect(saveUserProduct(validDraft({ title: "Tin cũ" }), storage).ok).toBe(true);
    const before = storage.getItem(STORAGE_KEY);
    storage.quotaBytes = before!.length; // lần ghi tiếp theo sẽ vượt quota
    const res = saveUserProduct(validDraft({ title: "Tin mới" }), storage);
    expect(res).toEqual({ ok: false, error: QUOTA_ERROR_MESSAGE });
    expect(storage.getItem(STORAGE_KEY)).toBe(before);
    expect(loadUserProducts(storage).map((p) => p.title)).toEqual(["Tin cũ"]);
  });

  it("xóa tin theo id", () => {
    const res = saveUserProduct(validDraft(), storage);
    if (!res.ok) throw new Error("save failed");
    expect(deleteUserProduct(res.product.id, storage).ok).toBe(true);
    expect(loadUserProducts(storage)).toEqual([]);
  });
});

describe("storage hỏng", () => {
  it("JSON lỗi → bỏ qua, vẫn có mock data", () => {
    storage.setItem(STORAGE_KEY, "{not json");
    expect(loadUserProducts(storage)).toEqual([]);
    expect(getAllProducts(loadUserProducts(storage))).toHaveLength(MOCK_PRODUCTS.length);
  });

  it("sai cấu trúc → chỉ bỏ phần lỗi", () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }));
    expect(loadUserProducts(storage)).toEqual([]);

    const good = { ...MOCK_PRODUCTS[0], id: "u-ok", source: "user" };
    storage.setItem(STORAGE_KEY, JSON.stringify([good, { id: 1 }, null, "x", { ...good, id: "u-bad", images: "nope" }]));
    expect(loadUserProducts(storage).map((p) => p.id)).toEqual(["u-ok"]);
  });

  it("getItem ném lỗi hoặc không có storage → không crash", () => {
    const broken = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(loadUserProducts(broken)).toEqual([]);
    expect(loadUserProducts(null)).toEqual([]);
    expect(saveUserProduct(validDraft(), broken).ok).toBe(false);
  });
});

describe("findProduct", () => {
  it("id không tồn tại → undefined; id mock → trả về tin", () => {
    const all = getAllProducts([]);
    expect(findProduct(all, "abc")).toBeUndefined();
    expect(findProduct(all, MOCK_PRODUCTS[0].id)?.id).toBe(MOCK_PRODUCTS[0].id);
  });
});

describe("validateProduct — các trường hợp lỗi", () => {
  it.each<[string, Partial<ProductDraft>, keyof ProductDraft]>([
    ["khu vực rỗng", { location: "  " }, "location"],
    ["tình trạng không hợp lệ", { condition: "cu" as ProductDraft["condition"] }, "condition"],
    ["tiêu đề 101 ký tự", { title: "a".repeat(101) }, "title"],
    ["mô tả 2001 ký tự", { description: "a".repeat(2001) }, "description"],
    ["giá lẻ", { price: 1.5 }, "price"],
    ["giá vượt MAX_SAFE_INTEGER", { price: Number.MAX_SAFE_INTEGER + 2 }, "price"],
    ["danh mục không tồn tại", { categoryId: "khong-co" }, "categoryId"],
  ])("%s → lỗi ở %s", (_label, over, field) => {
    const errors = validateProduct(validDraft(over));
    expect(Object.keys(errors)).toEqual([field]);
  });

  it("tiêu đề 100 ký tự, mô tả 2000 ký tự (sau trim) vẫn hợp lệ", () => {
    expect(validateProduct(validDraft({ title: "a".repeat(100), description: ` ${"a".repeat(2000)} ` }))).toEqual({});
  });
});

describe("lưu nhiều tin", () => {
  it("lưu 2 tin, xóa 1, tin còn lại vẫn giữ", () => {
    const a = saveUserProduct(validDraft({ title: "Tin A" }), storage);
    const b = saveUserProduct(validDraft({ title: "Tin B" }), storage);
    if (!a.ok || !b.ok) throw new Error("save failed");
    expect(loadUserProducts(storage).map((p) => p.title)).toEqual(["Tin B", "Tin A"]);
    expect(deleteUserProduct(a.product.id, storage).ok).toBe(true);
    expect(loadUserProducts(storage).map((p) => p.id)).toEqual([b.product.id]);
  });
});

describe("loadUserProducts — lọc dữ liệu lưu không hợp lệ", () => {
  const good = { ...MOCK_PRODUCTS[0], id: "u-1", source: "user" as const };

  it("bỏ tin có src ảnh không hợp lệ hoặc không có ảnh", () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        good,
        { ...good, id: "u-js", images: ["javascript:alert(1)"] },
        { ...good, id: "u-rel", images: ["anh.png"] },
        { ...good, id: "u-empty", images: [] },
        { ...good, id: "u-data", images: ["data:image/jpeg;base64,AAAA", "/local.png"] },
      ]),
    );
    expect(loadUserProducts(storage).map((p) => p.id)).toEqual(["u-1", "u-data"]);
  });

  it("bỏ tin có giá / tiêu đề / danh mục không hợp lệ", () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { ...good, id: "u-neg", price: -1 },
        { ...good, id: "u-zero", price: 0 },
        { ...good, id: "u-frac", price: 1.5 },
        { ...good, id: "u-big", price: 1e300 },
        { ...good, id: "u-str", price: "100" },
        { ...good, id: "u-title", title: "  " },
        { ...good, id: "u-cat", categoryId: "khong-co" },
        good,
      ]),
    );
    expect(loadUserProducts(storage).map((p) => p.id)).toEqual(["u-1"]);
  });

  it("trùng id → giữ bản đầu tiên", () => {
    storage.setItem(STORAGE_KEY, JSON.stringify([good, { ...good, title: "Bản sau" }]));
    const loaded = loadUserProducts(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe(good.title);
  });
});
