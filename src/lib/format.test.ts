import { describe, expect, it } from "vitest";
import { formatPrice, formatRelativeTime, parsePrice } from "./format";

describe("parsePrice", () => {
  it.each([
    ["1500000", 1_500_000],
    ["1.500.000", 1_500_000],
    ["1 500 000", 1_500_000],
    [" 250.000 ", 250_000],
    ["0", 0],
  ])("%j → %d", (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });

  it.each(["-5", "1,5", "1.5", "abc", "1,5 triệu", "", "1.500 000", "15.00", "1e6"])("%j → không hợp lệ", (input) => {
    expect(parsePrice(input)).toBeNull();
  });
});

describe("formatPrice", () => {
  it("định dạng vi-VN + đ", () => {
    expect(formatPrice(1_500_000)).toBe("1.500.000 đ");
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-10-15T12:00:00.000Z");
  it.each([
    ["2026-10-15T11:59:30.000Z", "vừa xong"],
    ["2026-10-15T11:15:00.000Z", "45 phút trước"],
    ["2026-10-15T07:00:00.000Z", "5 giờ trước"],
    ["2026-10-13T12:00:00.000Z", "2 ngày trước"],
    ["2026-08-01T12:00:00.000Z", "01/08/2026"],
    ["không phải ngày", ""],
  ])("%s → %j", (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });
});
