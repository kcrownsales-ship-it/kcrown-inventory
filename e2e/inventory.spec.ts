import { test, expect } from "@playwright/test";
test("create SKU, receive, reserve, partial ship and verify dashboard", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("DEMO · 示範環境")).toBeVisible();
  const sku = `E2E-${Date.now()}`;
  await page.getByRole("button", { name: "產品與 SKU", exact: true }).click();
  for (const [label, value] of [
    ["SKU", sku],
    ["產品型號", "E2E MODEL"],
    ["材質", "Aluminum"],
    ["長短版", "Short"],
    ["顏色", "示範藍"],
    ["相容系統", "MARUI"],
    ["容量 RDS", "31"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "建立商品", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("已完成並儲存");
  await page.getByRole("button", { name: "採購入庫", exact: true }).click();
  await page
    .getByLabel("商品 SKU")
    .selectOption({ label: `${sku} · E2E MODEL · 示範藍` });
  await page.getByLabel("採購單號").fill("E2E-PO");
  await page.getByLabel("入庫數量").fill("20");
  await page.getByRole("button", { name: "確認入庫", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("已完成並儲存");
  await page.getByRole("button", { name: "客戶訂單", exact: true }).click();
  await page
    .getByLabel("商品 SKU")
    .selectOption({ label: `${sku} · E2E MODEL · 示範藍` });
  await page.getByLabel("客戶名稱").fill(sku);
  await page.getByLabel("訂購數量").fill("12");
  await page.getByRole("button", { name: "建立並預留" }).click();
  await expect(page.getByRole("status")).toHaveText("已完成並儲存");
  await page.getByRole("button", { name: "分批出貨", exact: true }).click();
  await page
    .getByLabel("待交訂單")
    .selectOption({ label: `${sku} · ${sku} · 剩餘 12` });
  await page.getByLabel("本次出貨數量").fill("5");
  await page.getByLabel("出貨單號").fill("E2E-SHIP");
  await page.getByRole("button", { name: "確認出貨並扣庫存" }).click();
  await expect(page.getByRole("status")).toHaveText("已完成並儲存");
  await page.getByRole("button", { name: "庫存總覽", exact: true }).click();
  await page.getByPlaceholder("搜尋型號、顏色或 SKU").fill(sku);
  const row = page.locator("tbody tr");
  await expect(row).toHaveCount(1);
  await expect(row.locator("td").nth(3)).toHaveText("15");
  await expect(row.locator("td").nth(4)).toHaveText("7");
  await expect(row.locator("td").nth(5)).toHaveText("5");
  await expect(row.locator("td").nth(6)).toHaveText("7");
  await expect(row.locator("td").nth(7)).toHaveText("8");
  await page.reload();
  await page.getByPlaceholder("搜尋型號、顏色或 SKU").fill(sku);
  await expect(page.locator("tbody tr td").nth(3)).toHaveText("15");
});
test("API rejects foreign origin and invalid quantities", async ({
  request,
}) => {
  const body = {
    kind: "receive",
    requestId: crypto.randomUUID(),
    productId: "p0-0",
    quantity: -1,
    reference: "TEST",
  };
  expect(
    (
      await request.post("/api/operations", {
        headers: { origin: "https://other.invalid" },
        data: body,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/operations", {
        headers: { origin: "http://127.0.0.1:3000" },
        data: body,
      })
    ).status(),
  ).toBe(400);
});
