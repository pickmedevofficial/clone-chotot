import { describe, expect, it } from "vitest";
import { MOCK_PRODUCTS } from "@/data/mock-products";
import type { Product } from "@/types/product";
import { filterProducts, normalize } from "./search";

const make = (over: Partial<Product>): Product => ({
  ...MOCK_PRODUCTS[0],
  id: over.id ?? Math.random().toString(36),
  ...over,
});

const items: Product[] = [
  make({ id: "a", title: "Căn hộ đẹp", location: "Hà Nội", categoryId: "bat-dong-san", description: "" }),
  make({ id: "b", title: "Đất nền ven sông", location: "Đồng Nai", categoryId: "bat-dong-san", description: "" }),
  make({ id: "c", title: "Xe máy cũ", location: "Hà Nội", categoryId: "xe-co", description: "" }),
];

const ids = (list: Product[]) => list.map((p) => p.id);

describe("normalize", () => {
  it("bỏ dấu và đ", () => {
    expect(normalize("  Đất Hà Nội ")).toBe("dat ha noi");
  });
});

describe("filterProducts", () => {
  it('"ha noi" khớp tin ở Hà Nội', () => {
    expect(ids(filterProducts(items, "ha noi", null))).toEqual(["a", "c"]);
  });
  it('"dat" khớp "Đất…"', () => {
    expect(ids(filterProducts(items, "dat", null))).toEqual(["b"]);
  });
  it("nhiều từ khóa: phải khớp tất cả", () => {
    expect(ids(filterProducts(items, "xe ha noi", null))).toEqual(["c"]);
    expect(ids(filterProducts(items, "xe dong nai", null))).toEqual([]);
  });
  it("danh mục + từ khóa thu hẹp kết quả", () => {
    expect(ids(filterProducts(items, "", "bat-dong-san"))).toEqual(["a", "b"]);
    expect(ids(filterProducts(items, "ha noi", "bat-dong-san"))).toEqual(["a"]);
  });
  it("truy vấn rỗng trả về tất cả", () => {
    expect(filterProducts(items, "   ", null)).toHaveLength(3);
  });
  it("lọc theo khu vực, kết hợp với danh mục", () => {
    expect(ids(filterProducts(items, "", null, "Hà Nội"))).toEqual(["a", "c"]);
    expect(ids(filterProducts(items, "", "xe-co", "Hà Nội"))).toEqual(["c"]);
  });
});
