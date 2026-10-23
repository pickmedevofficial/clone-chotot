import { test, expect, type Page } from "@playwright/test";

async function goToTab(page: Page, name: string) {
  const menuButton = page.getByRole("button", { name: "Mở menu quản trị" });
  if (await menuButton.isVisible()) await menuButton.click();
  await page
    .getByRole("navigation", { name: "Quản trị" })
    .getByRole("button", { name: new RegExp(`^${name}`) })
    .click();
}

test("sidebar admin thu gọn thành menu trên màn hình nhỏ", async ({ page }) => {
  await page.goto("/admin");
  const menuButton = page.getByRole("button", { name: "Mở menu quản trị" });
  const navigation = page.getByRole("navigation", { name: "Quản trị" });

  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await expect(menuButton).toBeHidden();
    await expect(navigation).toBeVisible();
    return;
  }

  await expect(menuButton).toBeVisible();
  await expect(navigation).toBeHidden();
  await menuButton.click();
  await expect(navigation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(navigation).toBeHidden();
});

test("admin quản lý đơn, doanh số, khách hàng và sản phẩm", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Mỗi ngày, một bước tiến." }),
  ).toBeVisible();
  const adminNavigation = page.getByRole("navigation", { name: "Quản trị" });
  const menuButton = page.getByRole("button", { name: "Mở menu quản trị" });
  if (await menuButton.isVisible()) await menuButton.click();
  await expect(adminNavigation.getByRole("button")).toHaveCount(6);
  await expect(adminNavigation.locator("button > svg")).toHaveCount(6);
  if (await menuButton.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(adminNavigation).toBeHidden();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("admin-overview.png"),
    fullPage: true,
  });
  await goToTab(page, "Đơn hàng");
  await page.getByLabel("Tìm kiếm").fill("MD-DEMO-0001");
  await page.getByRole("button", { name: "MD-DEMO-0001", exact: true }).click();
  const delivery = page.getByRole("region", { name: "THÔNG TIN NHẬN HÀNG" });
  for (const label of [
    "Họ và tên",
    "Số điện thoại",
    "Email",
    "Tỉnh / thành phố",
    "Phường / xã",
    "Số nhà, tên đường",
    "Ghi chú giao hàng",
  ])
    await expect(delivery.getByText(label, { exact: true })).toBeVisible();
  await expect(delivery).toContainText("khach1@example.com");
  await expect(delivery).toContainText("Phường Bến Nghé");
  await expect(delivery).not.toContainText("quận / huyện");
  await delivery.getByRole("button", { name: "Sửa ghi chú giao hàng" }).click();
  await delivery
    .getByRole("textbox", { name: "Ghi chú giao hàng", exact: true })
    .fill("Giao sau 18h");
  await delivery
    .getByRole("button", { name: "Xong sửa ghi chú giao hàng" })
    .click();
  await expect(
    delivery.getByRole("textbox", { name: "Ghi chú giao hàng", exact: true }),
  ).toBeHidden();
  await expect(delivery).toContainText("Đã sửa · chưa lưu");
  await delivery.getByRole("button", { name: "Sửa phường / xã" }).click();
  await delivery
    .getByRole("textbox", { name: "Phường / xã", exact: true })
    .fill("Phường Tân Định");
  await delivery
    .getByRole("textbox", { name: "Phường / xã", exact: true })
    .press("Enter");
  await expect(
    delivery.getByRole("textbox", { name: "Phường / xã", exact: true }),
  ).toBeHidden();
  await page.getByLabel("Trạng thái đơn").selectOption("completed");
  await page.getByLabel("Nhân viên phụ trách").selectOption("NV02");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.locator("tbody tr")).toContainText("Hoàn tất");
  await page.reload();
  await goToTab(page, "Đơn hàng");
  await page.getByLabel("Tìm kiếm").fill("MD-DEMO-0001");
  await page.getByRole("button", { name: "MD-DEMO-0001", exact: true }).click();
  await expect(delivery).toContainText("Giao sau 18h");
  await expect(delivery).toContainText("Phường Tân Định");
  await page.getByRole("button", { name: "Đóng", exact: true }).first().click();
  await goToTab(page, "Khách hàng");
  await page.getByRole("button", { name: "+ Thêm khách hàng" }).click();
  await page.getByLabel("Họ và tên").fill("Khách kiểm thử");
  await page.getByLabel("Số điện thoại").fill("+84 912 345 678");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await page.getByLabel("Tìm kiếm").fill("0912345678");
  await expect(page.locator("tbody tr")).toContainText("Khách kiểm thử");
  await goToTab(page, "Nhân viên");
  await page.getByRole("button", { name: "+ Thêm nhân viên" }).click();
  await page.getByLabel("Họ và tên").fill("Nhân viên kiểm thử");
  await page.getByLabel("Số điện thoại").fill("0987654321");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.locator("tbody")).toContainText("Nhân viên kiểm thử");
  await goToTab(page, "Sản phẩm");
  await page
    .getByRole("button", { name: "Chỉnh sửa", exact: true })
    .first()
    .click();
  await page.getByLabel("Tồn kho admin").fill("5");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.locator("tbody tr").first()).toContainText("5");
  await page.screenshot({
    path: testInfo.outputPath("admin-products.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
