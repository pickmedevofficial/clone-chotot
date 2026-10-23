import { test, expect, type Page } from "@playwright/test";

async function addShampoo(page: Page, quantity = 1) {
  await page.goto("/san-pham/dau-goi-1-1");
  if (quantity === 2)
    await page
      .getByRole("button", { name: "Tăng số lượng", exact: true })
      .click();
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();
  await expect(page).toHaveURL(/\/gio-hang$/);
}
async function fillBuyer(page: Page) {
  await page.getByLabel("Họ và tên").fill("Nguyễn Văn Nam");
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await page.getByLabel("Tỉnh / thành phố").fill("Hà Nội");
  await page.getByLabel("Khu vực / quận / huyện").fill("Cầu Giấy");
  await page.getByLabel("Phường / xã").fill("Dịch Vọng");
  await page.getByLabel("Số nhà, tên đường").fill("12 Trần Thái Tông");
  await page.getByRole("checkbox").check();
}

test("lọc danh mục, tìm kiếm không dấu và hiển thị gọn trên màn hình", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Chăm chút mỗi ngày",
  );
  await page.screenshot({
    path: testInfo.outputPath("storefront.png"),
    fullPage: true,
  });
  await page.screenshot({ path: testInfo.outputPath("storefront-top.png") });
  expect(
    await page
      .getByRole("heading", { level: 1 })
      .evaluate(
        (el) =>
          el.getBoundingClientRect().right <=
          el.closest("section")!.getBoundingClientRect().right,
      ),
  ).toBe(true);
  await page.getByRole("button", { name: /Sữa rửa mặt.*50 lựa chọn/ }).click();
  await expect(page.locator("#products-heading")).toContainText("50 lựa chọn");
  await page
    .getByLabel("Thương hiệu", { exact: true })
    .selectOption("NIVEA MEN");
  await expect(page.locator("#products-heading")).toContainText("10 lựa chọn");
  await page.getByRole("searchbox").fill("nivea rua mat");
  await expect(page.locator("#products-heading")).toContainText("10 lựa chọn");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("đặt hàng chuyển khoản với ship nhanh, voucher và QR; tải lại vẫn giữ đơn", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await addShampoo(page, 2);
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng của bạn" }),
  ).toContainText("2");
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click();
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng của bạn" }),
  ).toContainText("3");
  await page.getByRole("button", { name: /^Giảm số lượng/ }).click();
  await page.getByRole("link", { name: "Tiến hành đặt hàng" }).click();
  await page.getByRole("button", { name: "Xác nhận đặt hàng" }).click();
  await expect(
    page.getByText("Nhập số điện thoại Việt Nam hợp lệ"),
  ).toBeVisible();
  await fillBuyer(page);
  await page.getByRole("radio", { name: /Giao nhanh/ }).check();
  await page.getByRole("radio", { name: /Chuyển khoản ngân hàng/ }).check();
  await page.getByRole("button", { name: "HELLO10", exact: true }).click();
  await expect(page.getByText("Đã áp dụng HELLO10")).toBeVisible();
  await expect(page.getByText("368.600 đ", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận đặt hàng" }).click();
  await expect(page).toHaveURL(/\/don-hang\/MD[A-Z0-9]+$/);
  await expect(
    page.getByRole("heading", { name: "Đã tạo đơn hàng demo" }),
  ).toBeVisible();
  await expect(page.getByText("Chờ thanh toán", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("img", { name: /QR minh họa đơn/ }),
  ).toBeVisible();
  await expect(
    page.getByText("12 Trần Thái Tông, Dịch Vọng, Cầu Giấy, Hà Nội"),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("order.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Đã tạo đơn hàng demo" }),
  ).toBeVisible();
  const data = await page.evaluate(() => ({
    cart: JSON.parse(localStorage.getItem("mendaily:cart:v1")!),
    orders: JSON.parse(localStorage.getItem("mendaily:orders:v1")!),
  }));
  expect(data.cart).toEqual([]);
  expect(data.orders).toHaveLength(1);
  expect(data.orders[0].totals.total).toBe(368600);
  await page.getByRole("link", { name: "Xem lịch sử đơn" }).click();
  await expect(page).toHaveURL(/\/don-hang$/);
  await expect(
    page.getByRole("link").filter({ hasText: "368.600 đ" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("voucher sai không tạo đơn; lỗi lưu không làm mất giỏ; COD đặt thành công", async ({
  page,
}) => {
  await addShampoo(page);
  await page.getByRole("link", { name: "Tiến hành đặt hàng" }).click();
  await fillBuyer(page);
  await page.getByRole("button", { name: "HELLO10", exact: true }).click();
  await expect(
    page.getByText("HELLO10 áp dụng cho đơn từ 200.000đ", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận đặt hàng" }).click();
  await expect(page).toHaveURL(/\/thanh-toan$/);
  expect(
    await page.evaluate(() => localStorage.getItem("mendaily:orders:v1")),
  ).toBeNull();
  await page.getByRole("button", { name: "Bỏ mã", exact: true }).click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "mendaily:orders:v1")
        throw new DOMException("Full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Xác nhận đặt hàng" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Không thể lưu dữ liệu",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("mendaily:cart:v1")!).length,
    ),
  ).toBe(1);
  await page.reload();
  await fillBuyer(page);
  await page.getByRole("button", { name: "Xác nhận đặt hàng" }).click();
  await expect(
    page.getByText("Chờ xác nhận · COD", { exact: true }),
  ).toBeVisible();
});

test("dữ liệu lưu trữ hỏng không làm sập trang admin và cửa hàng", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("mendaily:cart:v1", "bad-json");
    localStorage.setItem(
      "mendaily:orders:v1",
      JSON.stringify([{ id: "invalid" }]),
    );
  });
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Mỗi ngày, một bước tiến." }),
  ).toBeVisible();
  await page.goto("/don-hang");
  await expect(
    page.getByRole("heading", { name: "Bạn chưa có đơn hàng nào" }),
  ).toBeVisible();
});
