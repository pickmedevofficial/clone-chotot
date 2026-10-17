import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import { filterProducts, normalize } from "./search";
describe("search", () => {
  it("tìm không dấu và theo thương hiệu", () => {
    expect(normalize("  Sữa Rửa Mặt ")).toBe("sua rua mat");
    const result = filterProducts(PRODUCTS, "nivea rua mat", null);
    expect(result).toHaveLength(10);
    expect(result.every((p) => p.categoryId === "sua-rua-mat")).toBe(true);
  });
  it("kết hợp danh mục và tất cả từ khóa", () => {
    expect(filterProducts(PRODUCTS, "nivea", "lan-khu-mui")).toHaveLength(15);
    expect(filterProducts(PRODUCTS, "nivea gillette", null)).toEqual([]);
    expect(filterProducts(PRODUCTS, "", "dau-goi")).toHaveLength(50);
  });
});
