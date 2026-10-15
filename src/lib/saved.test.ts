import { describe, expect, it } from "vitest";
import { getSeller, maskPhone } from "@/data/sellers";
import { SAVED_STORAGE_KEY, loadSavedIds, toggleSaved } from "./saved";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("toggleSaved", () => {
  it("lưu rồi bỏ lưu", () => {
    const s = memoryStorage();
    expect(toggleSaved("a", s)).toBe(true);
    toggleSaved("b", s);
    expect(loadSavedIds(s)).toEqual(["b", "a"]);
    toggleSaved("a", s);
    expect(loadSavedIds(s)).toEqual(["b"]);
  });

  it("bỏ qua dữ liệu hỏng", () => {
    expect(loadSavedIds(memoryStorage({ [SAVED_STORAGE_KEY]: "{oops" }))).toEqual([]);
    expect(loadSavedIds(memoryStorage({ [SAVED_STORAGE_KEY]: '["a", 1, "a"]' }))).toEqual(["a"]);
  });

  it("trả false khi không ghi được", () => {
    const s = { getItem: () => null, setItem: () => { throw new Error("quota"); } };
    expect(toggleSaved("a", s)).toBe(false);
    expect(toggleSaved("a", null)).toBe(false);
  });
});

describe("getSeller", () => {
  it("ổn định theo id, số điện thoại 10 chữ số", () => {
    const a = getSeller({ id: "m-01", source: "mock" });
    expect(getSeller({ id: "m-01", source: "mock" })).toEqual(a);
    expect(a.phone).toMatch(/^09\d{8}$/);
    expect(maskPhone(a.phone)).toBe(`${a.phone.slice(0, 6)}****`);
  });
});
