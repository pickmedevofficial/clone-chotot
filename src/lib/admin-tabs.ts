import type { IconType } from "react-icons";
import {
  FaBoxOpen,
  FaChartLine,
  FaClipboardList,
  FaHouse,
  FaUserGroup,
  FaUserTie,
} from "react-icons/fa6";

// Không đánh dấu "use client" để trang server (/admin) dùng được `isAdminTab`.
export const ADMIN_TABS = [
  ["overview", "Tổng quan", FaHouse],
  ["orders", "Đơn hàng", FaClipboardList],
  ["employees", "Nhân viên", FaUserTie],
  ["sales", "Doanh số nhân viên", FaChartLine],
  ["products", "Sản phẩm", FaBoxOpen],
  ["customers", "Khách hàng", FaUserGroup],
] as const satisfies readonly (readonly [string, string, IconType])[];
export type AdminTab = (typeof ADMIN_TABS)[number][0];
export function isAdminTab(value: unknown): value is AdminTab {
  return ADMIN_TABS.some(([id]) => id === value);
}
