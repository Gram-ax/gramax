import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

catalogTest.use({
	startUrl: "/test-catalog",
	dir: new URL(".", import.meta.url),
	isolated: true,
});

catalogTest.describe("creating a child article preserves parent tree state", () => {
	catalogTest.beforeEach(async ({ sharedPage, catalogPage }) => {
		await sharedPage.evaluate(() => localStorage.removeItem("nav-tree-state"));
		await sharedPage.reload();
		await catalogPage.waitForLoad();
	});

	catalogTest("parent category stays expanded after adding a child article", async ({ sharedPage, catalogPage }) => {
		const leafArticle = sharedPage.getByTitle("Leaf Article");
		const childCategoryItem = sharedPage
			.locator('[data-qa^="catalog-navigation"]')
			.filter({ has: sharedPage.getByTitle("Child Category", { exact: true }) });

		await childCategoryItem.locator(".angle").click();
		await expect(leafArticle).toBeVisible();

		await childCategoryItem.hover();
		await childCategoryItem.getByTestId("create-article").click();

		await catalogPage.waitForLoad();

		await expect(leafArticle).toBeVisible();
	});

	catalogTest(
		"newly created child article becomes active and selected in the nav tree",
		async ({ sharedPage, catalogPage }) => {
			const childCategoryItem = sharedPage
				.locator('[data-qa^="catalog-navigation"]')
				.filter({ has: sharedPage.getByTitle("Child Category", { exact: true }) });

			await childCategoryItem.locator(".angle").click();

			await childCategoryItem.hover();
			await childCategoryItem.getByTestId("create-article").click();

			await catalogPage.waitForLoad();

			await expect(sharedPage).toHaveURL(/untitled/);
			// Active nav items are not wrapped in a link; verify the new item is present but not a link
			await expect(sharedPage.getByText("Untitled", { exact: true })).toBeVisible();
			await expect(sharedPage.getByRole("link", { name: "Untitled", exact: true })).not.toBeAttached();
		},
	);

	catalogTest(
		"a branch opened by navigation stays expanded after creating a sibling article higher up",
		async ({ sharedPage, catalogPage }) => {
			const nav = sharedPage.locator('[data-qa^="catalog-navigation"]');
			const leafInNav = nav.getByText("Leaf Article", { exact: true });
			const parentCategoryItem = sharedPage
				.locator('[data-qa^="catalog-navigation"]')
				.filter({ has: sharedPage.getByTitle("Parent Category", { exact: true }) });

			await sharedPage.goto("/-/-/-/-/test-catalog/parent-category/child-category/leaf-article");
			await catalogPage.waitForLoad();
			await expect(leafInNav).toBeVisible();

			await parentCategoryItem.hover();
			await parentCategoryItem.getByTestId("create-article").click();
			await catalogPage.waitForLoad();

			await expect(leafInNav).toBeVisible();
		},
	);
});
