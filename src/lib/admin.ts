import { PRODUCTS } from "@/data/products";
import type { Order } from "@/types/shop";

export type AdminStatus = "pending" | "shipping" | "completed" | "cancelled";
export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  target: number;
  active: boolean;
}
export interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
}
export interface Delivery {
  province: string;
  ward: string;
  street: string;
  note: string;
}
export interface AdminOrder {
  id: string;
  createdAt: string;
  customer: Customer;
  /** Thông tin giao hàng tách theo từng trường; dữ liệu cũ có thể chưa có. */
  delivery?: Delivery;
  employeeId: string;
  status: AdminStatus;
  items: { title: string; quantity: number; price: number }[];
  merchandise: number;
  total: number;
}
export interface AdminData {
  employees: Employee[];
  customers: Customer[];
  orders: AdminOrder[];
  overrides: Record<string, { price: number; stock: number; active: boolean }>;
  orderUpdates: Record<
    string,
    {
      status: AdminStatus;
      employeeId: string;
      /** Thông tin nhận hàng đã được admin chỉnh sửa (nếu có). */
      customer?: Customer;
      delivery?: Delivery;
    }
  >;
}
export const STATUS_LABELS: Record<AdminStatus, string> = {
  pending: "Chờ xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};
export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("84") ? `0${digits.slice(2)}` : digits;
}
export function validPhone(phone: string) {
  return /^0[35789]\d{8}$/.test(normalizePhone(phone));
}
export function earnedPoints(order: AdminOrder) {
  return order.status === "completed"
    ? Math.floor(order.merchandise / 10000)
    : 0;
}
export function employeeRevenue(orders: AdminOrder[], id: string) {
  return orders
    .filter((o) => o.employeeId === id && o.status === "completed")
    .reduce((sum, o) => sum + o.merchandise, 0);
}
export function customerSummary(customers: Customer[], orders: AdminOrder[]) {
  const map = new Map<
    string,
    Customer & { orders: number; spent: number; points: number }
  >();
  for (const c of [...orders.map((o) => o.customer), ...customers]) {
    const phone = normalizePhone(c.phone);
    if (validPhone(phone))
      map.set(phone, { ...c, phone, orders: 0, spent: 0, points: 0 });
  }
  for (const o of orders) {
    const c = map.get(normalizePhone(o.customer.phone));
    if (c) {
      c.orders++;
      if (o.status === "completed") c.spent += o.merchandise;
      c.points += earnedPoints(o);
    }
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent);
}
export function mergeOrders(
  data: AdminData,
  storefront: Order[],
): AdminOrder[] {
  const converted: AdminOrder[] = storefront.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    customer: {
      name: o.buyer.name,
      phone: o.buyer.phone,
      email: o.buyer.email,
      address: [o.buyer.address, o.buyer.ward, o.buyer.province]
        .filter(Boolean)
        .join(", "),
    },
    delivery: {
      province: o.buyer.province,
      ward: o.buyer.ward,
      street: o.buyer.address,
      note: o.buyer.note,
    },
    employeeId: "",
    status: "pending",
    items: o.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      price: i.unitPrice,
    })),
    merchandise: Math.max(0, o.totals.subtotal - o.totals.discount),
    total: o.totals.total,
  }));
  return [
    ...converted,
    ...data.orders.filter((o) => !converted.some((c) => c.id === o.id)),
  ]
    .map((o) => ({ ...o, ...data.orderUpdates[o.id] }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
const DEMO_WARDS = [
  "Phường Bến Nghé",
  "Phường Thảo Điền",
  "Phường Tân Định",
  "Phường 7",
];
const DEMO_NOTES = [
  "",
  "Gọi trước khi giao",
  "Giao giờ hành chính",
  "",
  "Để ở quầy lễ tân",
];
export function seedAdmin(): AdminData {
  const employees: Employee[] = [
    {
      id: "NV01",
      name: "Nguyễn Minh Anh",
      phone: "0900000101",
      role: "Quản lý cửa hàng",
      target: 12000000,
      active: true,
    },
    {
      id: "NV02",
      name: "Trần Hoàng Nam",
      phone: "0900000102",
      role: "Tư vấn bán hàng",
      target: 10000000,
      active: true,
    },
    {
      id: "NV03",
      name: "Lê Thu Hà",
      phone: "0900000103",
      role: "Tư vấn bán hàng",
      target: 10000000,
      active: true,
    },
    {
      id: "NV04",
      name: "Phạm Đức Huy",
      phone: "0900000104",
      role: "Tư vấn bán hàng",
      target: 8000000,
      active: true,
    },
  ];
  const customers: Customer[] = [
    "Nguyễn Văn An",
    "Trần Bảo Long",
    "Lê Minh Khang",
    "Phạm Quốc Bảo",
    "Hoàng Thanh Tùng",
    "Vũ Gia Huy",
    "Đặng Tuấn Kiệt",
    "Bùi Nhật Minh",
    "Đỗ Hải Đăng",
    "Ngô Quang Huy",
    "Đinh Anh Tuấn",
    "Mai Hoàng Phúc",
  ].map((name, i) => ({
    name,
    phone: `0900000${String(i + 201).padStart(3, "0")}`,
    email: `khach${i + 1}@example.com`,
    address: `${12 + i} Đường số ${i + 1}, ${DEMO_WARDS[i % DEMO_WARDS.length]}, TP. Hồ Chí Minh`,
  }));
  const orders: AdminOrder[] = Array.from({ length: 36 }, (_, i) => {
    const p = PRODUCTS[(i * 13) % PRODUCTS.length];
    const quantity = (i % 3) + 1;
    const c = i % customers.length;
    return {
      id: `MD-DEMO-${String(i + 1).padStart(4, "0")}`,
      createdAt: new Date(
        Date.UTC(2026, 9, 23 - Math.floor(i / 2), 8 + (i % 8)),
      ).toISOString(),
      customer: customers[c],
      delivery: {
        province: "TP. Hồ Chí Minh",
        ward: DEMO_WARDS[c % DEMO_WARDS.length],
        street: `${12 + c} Đường số ${c + 1}`,
        note: DEMO_NOTES[i % DEMO_NOTES.length],
      },
      employeeId: employees[i % 4].id,
      status:
        i < 4
          ? "pending"
          : i < 8
            ? "shipping"
            : i % 11 === 0
              ? "cancelled"
              : "completed",
      items: [{ title: p.title, quantity, price: p.price }],
      merchandise: p.price * quantity,
      total: p.price * quantity + 30000,
    };
  });
  return { employees, customers, orders, overrides: {}, orderUpdates: {} };
}
