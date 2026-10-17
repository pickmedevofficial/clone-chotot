import { test, expect } from "@playwright/test";

for (const width of [360, 390, 430]) {
  test(`trang chủ gọn và đọc được ở ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Kiểm tra bố cục điện thoại");
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const sizes = await page.evaluate(() => {
      const hero = document
        .querySelector(".hero-grid")!
        .getBoundingClientRect();
      const categories = document
        .querySelector('[aria-labelledby="category-heading"]')!
        .getBoundingClientRect();
      const offer = [...document.querySelectorAll("main > section")]
        .find((el) => el.textContent?.includes("HELLO10"))!
        .getBoundingClientRect();
      const firstProduct = document
        .querySelector("#san-pham article")!
        .getBoundingClientRect();
      return {
        hero: hero.height,
        categories: categories.height,
        offer: offer.height,
        firstProductTop: firstProduct.top,
        card: firstProduct.height,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(sizes.hero).toBeLessThanOrEqual(250);
    expect(sizes.categories).toBeLessThanOrEqual(250);
    expect(sizes.offer).toBeLessThanOrEqual(130);
    expect(sizes.firstProductTop).toBeLessThanOrEqual(1050);
    expect(sizes.card).toBeLessThanOrEqual(320);
    expect(sizes.overflow).toBe(false);
    await page.screenshot({
      path: testInfo.outputPath(`mobile-${width}.png`),
      fullPage: true,
    });
    await page.screenshot({
      path: testInfo.outputPath(`mobile-top-${width}.png`),
    });
    console.log(`Mobile ${width}px: ${JSON.stringify(sizes)}`);
  });
}
