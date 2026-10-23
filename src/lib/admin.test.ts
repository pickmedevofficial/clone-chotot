import { describe, expect, it } from "vitest";
import {
  customerSummary,
  employeeRevenue,
  earnedPoints,
  mergeOrders,
  normalizePhone,
  seedAdmin,
} from "./admin";
describe("admin accounting", () => {
  it("gộp số điện thoại Việt Nam theo cùng một khóa", () => {
    expect(normalizePhone("+84 900 000 201")).toBe("0900000201");
    const d = seedAdmin();
    const o = {
      ...d.orders[0],
      status: "completed" as const,
      merchandise: 125000,
      customer: { ...d.customers[0], phone: "+84 900 000 201" },
    };
    const rows = customerSummary([d.customers[0]], [o]);
    expect(rows).toHaveLength(1);
    expect(rows[0].points).toBe(12);
    expect(rows[0].spent).toBe(125000);
  });
  it("chỉ ghi nhận doanh số và điểm từ đơn hoàn tất", () => {
    const o = {
      ...seedAdmin().orders[0],
      merchandise: 125000,
      employeeId: "NV01",
    };
    expect(earnedPoints(o)).toBe(0);
    expect(employeeRevenue([o], "NV01")).toBe(0);
    const done = { ...o, status: "completed" as const };
    expect(employeeRevenue([done], "NV01")).toBe(125000);
    expect(earnedPoints(done)).toBe(12);
    expect(earnedPoints({ ...done, status: "cancelled" })).toBe(0);
  });
  it("tính lại trạng thái thay vì cộng điểm lặp", () => {
    const d = seedAdmin();
    d.orderUpdates[d.orders[0].id] = {
      status: "completed",
      employeeId: "NV02",
    };
    const once = mergeOrders(d, []);
    const twice = mergeOrders(d, []);
    expect(customerSummary(d.customers, once)).toEqual(
      customerSummary(d.customers, twice),
    );
    expect(once.find((o) => o.id === d.orders[0].id)?.employeeId).toBe("NV02");
  });
});
