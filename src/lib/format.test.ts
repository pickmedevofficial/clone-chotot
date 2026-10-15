import { describe, expect, it } from "vitest";
import { formatPrice, parsePrice } from "./format";

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
