import { baseTest as test } from "@docportal/fixtures/base.fixture";
import { expect } from "@playwright/test";

test.use({ source: "env", user: "env" });

const catalogs = [
	{ name: "test-catalog", humanName: "Автотест", anchor: "Catalog" },
	{ name: "test-catalog-no-index", humanName: "No Index", anchor: "Article H1" },
] as const;

test.describe("switch articles", () => {
	for (const { name, humanName, anchor } of catalogs) {
		test(name, async ({ basePage }) => {
			const page = basePage.raw;

			await page.getByRole("button", { name: humanName }).click();
			await basePage.waitForLoad();

			const articles = page.getByRole("list").filter({ hasText: anchor }).getByRole("link");

			let count = await articles.count();

			expect(count).toBeGreaterThan(0);

			for (let i = 0; i < count; i++) {
				await articles.nth(i).click();
				await basePage.waitForLoad();
				await basePage.assertNoModal();
				count = await articles.count();
			}
		});
	}
});
