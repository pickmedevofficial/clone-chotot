export type ProductCondition = "moi" | "da-su-dung";

export type ProductSource = "mock" | "user";

export interface Product {
  id: string;
  title: string;
  /** Giá bằng đồng (VND), số nguyên dương. */
  price: number;
  categoryId: string;
  location: string;
  description: string;
  /** URL ảnh (http(s) cho mock, data URL cho tin do người dùng đăng). */
  images: string[];
  condition: ProductCondition;
  /** ISO 8601. */
  createdAt: string;
  source: ProductSource;
}

/** Dữ liệu form trước khi được chuẩn hóa thành Product. */
export interface ProductDraft {
  title: string;
  price: number;
  categoryId: string;
  location: string;
  description: string;
  images: string[];
  condition: ProductCondition;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
