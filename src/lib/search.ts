import { getCategoryName } from "@/data/categories";
import type { Product } from "@/types/product";

/** Bỏ dấu tiếng Việt + chữ thường để "ha noi" khớp "Hà Nội". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** Lọc theo danh mục và từ khóa; mọi từ trong truy vấn đều phải xuất hiện. */
export function filterProducts(products: Product[], query: string, categoryId: string | null): Product[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return products.filter((p) => {
    if (categoryId && p.categoryId !== categoryId) return false;
    if (terms.length === 0) return true;
    const haystack = normalize(`${p.title} ${p.description} ${p.location} ${getCategoryName(p.categoryId)}`);
    return terms.every((t) => haystack.includes(t));
  });
}
