import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

catalogTest.use({
	startUrl: "/test-catalog",
	dir: new URL(".", import.meta.url),
	isolated: true,
});

catalogTest.describe("Saving Left Nav Tree State (edit mode)", () => {
	catalogTest("expanded state persists across page reload", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const leafArticle = sharedPage.getByTitle("Leaf Article");
		const childCategoryItem = sharedPage.locator("a", { has: sharedPage.locator('[title="Child Category"]') });
		const childCategoryChevron = childCategoryItem.locator(".angle");

		// Child category is visible (parent is open at root level), leaf is not
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
		await catalogPage.waitForLoad();

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

	catalogTest("expanding multiple siblings persists both after reload", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const leafArticle = sharedPage.getByTitle("Leaf Article");
		const siblingLeaf = sharedPage.getByTitle("Sibling Leaf");

		const childCategoryItem = sharedPage.locator("a", { has: sharedPage.locator('[title="Child Category"]') });
		const siblingCategoryItem = sharedPage.locator("a", {
			has: sharedPage.locator('[title="Sibling Category"]'),
		});

		const childCategoryChevron = childCategoryItem.locator(".angle");
		const siblingCategoryChevron = siblingCategoryItem.locator(".angle");

		// Expand both categories
		await childCategoryChevron.click();
		await expect(leafArticle).toBeVisible();

		await siblingCategoryChevron.click();
		await expect(siblingLeaf).toBeVisible();

		// Wait for state to include both paths
		await expect
			.poll(() => catalogPage.getNavTreeState("test-catalog"))
			.toContain("test-catalog/parent-category/child-category/_index.md");
		await expect
			.poll(() => catalogPage.getNavTreeState("test-catalog"))
			.toContain("test-catalog/parent-category/sibling-category/_index.md");

		// Reload — both should remain expanded
		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(leafArticle).toBeVisible();
		await expect(siblingLeaf).toBeVisible();
	});

	catalogTest("collapsing one sibling preserves the other after reload", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const leafArticle = sharedPage.getByTitle("Leaf Article");
		const siblingLeaf = sharedPage.getByTitle("Sibling Leaf");

		const childCategoryItem = sharedPage.locator("a", {
			has: sharedPage.locator('[title="Child Category"]'),
		});
		const siblingCategoryItem = sharedPage.locator("a", {
			has: sharedPage.locator('[title="Sibling Category"]'),
		});

		await expect(childCategoryItem).toBeVisible();
		await expect(siblingCategoryItem).toBeVisible();

		const childCategoryChevron = childCategoryItem.locator(".angle");
		const siblingCategoryChevron = siblingCategoryItem.locator(".angle");

		// Expand both
		await childCategoryChevron.click();
		await expect(leafArticle).toBeVisible();

		await siblingCategoryChevron.click();
		await expect(siblingLeaf).toBeVisible();

		// Collapse only child
		await childCategoryChevron.click();
		await expect(leafArticle).not.toBeVisible();
		await expect(siblingLeaf).toBeVisible();

		await expect
			.poll(() => catalogPage.getNavTreeState("test-catalog"))
			.not.toContain("test-catalog/parent-category/child-category/_index.md");
		await expect
			.poll(() => catalogPage.getNavTreeState("test-catalog"))
			.toContain("test-catalog/parent-category/sibling-category/_index.md");

		// Reload — sibling should stay expanded, child should be collapsed
		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(leafArticle).not.toBeVisible();
		await expect(siblingLeaf).toBeVisible();
	});

	catalogTest(
		"deleting an expanded category removes its path from localStorage",
		async ({ catalogPage, sharedPage }) => {
			await catalogPage.waitForLoad();

			const leafArticle = sharedPage.getByTitle("Leaf Article");
			const childCategoryItem = sharedPage.locator("a", { has: sharedPage.locator('[title="Child Category"]') });
			const childCategoryChevron = childCategoryItem.locator(".angle");

			// Ensure child-category starts collapsed (previous tests may leave it expanded)
			const isLeafVisible = await leafArticle.isVisible();
			if (isLeafVisible) {
				await childCategoryChevron.click();
				await expect(leafArticle).not.toBeVisible();
			}

			// Expand child-category so its path gets saved
			await childCategoryChevron.click();
			await expect(leafArticle).toBeVisible();
			await expect
				.poll(() => catalogPage.getNavTreeState("test-catalog"))
				.toContain("test-catalog/parent-category/child-category/_index.md");

			// Delete child-category via the edit menu
			sharedPage.once("dialog", (dialog) => dialog.accept());
			await childCategoryItem.hover();
			await childCategoryItem.locator("[aria-haspopup='menu']").click();
			await sharedPage.getByRole("menuitem", { name: /delete/i }).click();

			await catalogPage.waitForLoad();

			// Deleted path must be removed from localStorage
			await expect
				.poll(() => catalogPage.getNavTreeState("test-catalog"))
				.not.toContain("test-catalog/parent-category/child-category/_index.md");
		},
	);
});
