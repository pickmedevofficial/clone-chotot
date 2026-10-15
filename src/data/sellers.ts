import type { Product } from "@/types/product";

export interface Seller {
  name: string;
  /** 10 chữ số, chỉ dùng cho mock. */
  phone: string;
  soldCount: number;
  /** Phần trăm, 0–100. */
  responseRate: number;
}

const NAMES = ["Bình", "Minh Đạt", "Thu Hà", "Quốc Huy", "Ngọc Anh", "Tuấn Kiệt", "Lan Phương", "Hoàng Nam"];

/** Băm chuỗi ổn định (FNV-1a) để mỗi tin luôn ra cùng một người bán. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Dữ liệu chưa có người bán thật: sinh người bán mẫu cố định theo id tin. */
export function getSeller(product: Pick<Product, "id" | "source">): Seller {
  const h = hash(product.id);
  return {
    name: product.source === "user" ? "Bạn" : NAMES[h % NAMES.length],
    phone: `09${String(h % 100_000_000).padStart(8, "0")}`,
    soldCount: product.source === "user" ? 0 : h % 40,
    responseRate: 70 + (h % 31),
  };
}

/** "0904712345" → "090471****". */
export function maskPhone(phone: string): string {
  return `${phone.slice(0, -4)}****`;
}
