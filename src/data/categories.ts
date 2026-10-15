import type { Category } from "@/types/product";

export const CATEGORIES: Category[] = [
  { id: "bat-dong-san", name: "Bất động sản", icon: "🏠" },
  { id: "xe-co", name: "Xe cộ", icon: "🛵" },
  { id: "do-dien-tu", name: "Đồ điện tử", icon: "📱" },
  { id: "thu-cung", name: "Thú cưng", icon: "🐶" },
  { id: "viec-lam", name: "Việc làm", icon: "💼" },
  { id: "do-gia-dung", name: "Đồ gia dụng", icon: "🛋️" },
  { id: "thoi-trang", name: "Thời trang", icon: "👗" },
  { id: "dich-vu", name: "Dịch vụ", icon: "🛠️" },
];

export const LOCATIONS = [
  "Tp Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Bình Dương",
  "Đồng Nai",
  "Khánh Hòa",
];

export function getCategoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? "Khác";
}
