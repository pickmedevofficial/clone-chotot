const priceFormatter = new Intl.NumberFormat("vi-VN");

export function formatPrice(price: number): string {
  return `${priceFormatter.format(price)} đ`;
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatDate(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "" : dateFormatter.format(t);
}

/** Chữ số liền, hoặc nhóm hàng nghìn ngăn bởi dấu chấm/khoảng trắng nhất quán (vd "1.500.000"). */
const PRICE_PATTERN = /^(?:\d+|\d{1,3}(?:([. ])\d{3})(?:\1\d{3})*)$/;

/**
 * Chuyển chuỗi giá người dùng nhập thành số đồng. Trả về null nếu sai định dạng
 * (dấu trừ, phần thập phân như "1,5", chữ cái...) thay vì âm thầm sửa số.
 */
export function parsePrice(input: string): number | null {
  const text = input.trim();
  if (!PRICE_PATTERN.test(text)) return null;
  return Number(text.replace(/[. ]/g, ""));
}

/** "Đăng 3 giờ trước"-style; quá 30 ngày thì hiện ngày cụ thể. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const minutes = Math.floor((now - t) / 60_000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days <= 30) return `${days} ngày trước`;
  return dateFormatter.format(t);
}
