import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

catalogTest.use({
	startUrl: "/test-catalog",
	dir: new URL(".", import.meta.url),
	isolated: true,
	isReadOnly: true,
});

catalogTest.describe("Saving Left Nav Tree State (read-only mode)", () => {
	catalogTest("expanded state persists across page reload", async ({ catalogPage, sharedPage }) => {
		const leafArticle = sharedPage.getByTitle("Leaf Article");
		const childCategoryItem = sharedPage.locator("a", { has: sharedPage.locator('[title="Child Category"]') });
		const childCategoryChevron = childCategoryItem.locator(".angle");

		await expect(childCategoryItem).toBeVisible();
		await expect(leafArticle).not.toBeVisible();

		// Expand child category
		await childCategoryChevron.click();
		await expect(leafArticle).toBeVisible();

		// Wait for OPFS state to be saved
		await expect.poll(() => catalogPage.getNavTreeState("test-catalog")).not.toHaveLength(0);

		// Reload — expanded state should be restored from OPFS
		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(leafArticle).toBeVisible();
	});

	catalogTest("collapsed state persists after expand-then-collapse", async ({ catalogPage, sharedPage }) => {
		const leafArticle = sharedPage.getByTitle("Leaf Article");
		const childCategoryItem = sharedPage.locator("a", { has: sharedPage.getByText("Child Category") });
		const childCategoryChevron = childCategoryItem.locator(".angle");

		// Expand first
		await childCategoryChevron.click();
		await expect(leafArticle).toBeVisible();
		await expect.poll(() => catalogPage.getNavTreeState("test-catalog")).not.toHaveLength(0);

		// Then collapse
		await childCategoryChevron.click();
		await expect(leafArticle).not.toBeVisible();

		// Wait for OPFS state to be saved (child-category path removed)
		await expect
			.poll(() => catalogPage.getNavTreeState("test-catalog"))
			.not.toContain("test-catalog/parent-category/child-category/_index.md");

		// Reload — collapsed state should be restored from OPFS
		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(leafArticle).not.toBeVisible();
	});

	catalogTest("expanding one sibling does not affect another", async ({ catalogPage, sharedPage }) => {
		const leafArticle = sharedPage.getByTitle("Leaf Article");
		const siblingLeaf = sharedPage.getByTitle("Sibling Leaf");

		const childCategoryItem = sharedPage.locator("a", { has: sharedPage.locator('[title="Child Category"]') });
		const siblingCategoryItem = sharedPage.locator("a", {
			has: sharedPage.locator('[title="Sibling Category"]'),
		});

		const childCategoryChevron = childCategoryItem.locator(".angle");
		const siblingCategoryChevron = siblingCategoryItem.locator(".angle");

		// Expand only child category
		await childCategoryChevron.click();
		await expect(leafArticle).toBeVisible();
		await expect(siblingLeaf).not.toBeVisible();

		await expect.poll(() => catalogPage.getNavTreeState("test-catalog")).not.toHaveLength(0);

		// Reload — only child should be expanded, sibling stays collapsed
		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(leafArticle).toBeVisible();
		await expect(siblingLeaf).not.toBeVisible();

		// Now expand sibling too
		await siblingCategoryChevron.click();
		await expect(siblingLeaf).toBeVisible();

		await expect
			.poll(() => catalogPage.getNavTreeState("test-catalog"))
			.toContain("test-catalog/parent-category/sibling-category/_index.md");

		// Reload — both should be expanded
		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(leafArticle).toBeVisible();
		await expect(siblingLeaf).toBeVisible();
	});

	catalogTest("state persists when navigating to a different article", async ({ catalogPage, sharedPage }) => {
		const leafArticle = sharedPage.getByTitle("Leaf Article");
		const childCategoryItem = sharedPage.locator("a", { has: sharedPage.locator('[title="Child Category"]') });
		const childCategoryChevron = childCategoryItem.locator(".angle");

		// Expand child category
		await childCategoryChevron.click();
		await expect(leafArticle).toBeVisible();

		await expect.poll(() => catalogPage.getNavTreeState("test-catalog")).not.toHaveLength(0);

		// Navigate to a different article by clicking it
		await leafArticle.click();
		await sharedPage.waitForURL(/leaf-article/);

		// The child category should still be expanded after navigation
		await expect(leafArticle).toBeVisible();
	});
});
