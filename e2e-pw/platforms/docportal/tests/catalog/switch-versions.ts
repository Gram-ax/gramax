import { baseTest as test } from "@docportal/fixtures/base.fixture";
import { expect } from "@playwright/test";

test.use({ source: "env", user: "env" });

test.describe("versions", () => {
	test("switch branches in test-catalog", async ({ basePage }) => {
		const page = basePage.raw;

		await page.getByRole("button", { name: "Автотест" }).click();
		await basePage.waitForLoad();

		// master -> Z
		await page.getByRole("complementary").getByText("master").click();
		await page.getByRole("menuitemradio", { name: "Z" }).click();
		await basePage.waitForLoad();
		await basePage.assertNoModal();
		basePage.assertUrl("/test-catalog:Z");

		// Navigate to "Тег" article
		await page.getByRole("link", { name: "Тег" }).click();
		await basePage.waitForLoad();
		await basePage.assertNoModal();
		basePage.assertUrl("/test-catalog:Z/teg");

		// Z -> x (branch without this article - expect error)
		await page.getByRole("complementary").getByText("Z").click();
		await page.getByRole("menuitemradio", { name: "x" }).click();
		await basePage.waitForLoad();
		await expect(page.getByText("Check that the path is correct")).toBeVisible();
		basePage.assertUrl("/test-catalog:x/teg");

		// x -> test/g
		await page.getByRole("complementary").getByText("x", { exact: true }).click();
		await page.getByRole("menuitemradio", { name: "test/g" }).click();
		await basePage.waitForLoad();
		await basePage.assertNoModal();

		// test/g -> master
		await page.getByRole("complementary").getByText("test/g").click();
		await page.getByRole("menuitemradio", { name: "master" }).click();
		await basePage.waitForLoad();
		await basePage.assertNoModal();
		basePage.assertUrl("/test-catalog/teg");
	});
});
