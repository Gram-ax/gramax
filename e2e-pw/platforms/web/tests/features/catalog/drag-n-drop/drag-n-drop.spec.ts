import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

catalogTest.use({
	startUrl: "/test-catalog",
	dir: new URL(".", import.meta.url),
	isolated: true,
});

const navItem = (page: Page, title: string): Locator =>
	page.locator('[data-qa^="catalog-navigation"]').filter({ has: page.getByTitle(title, { exact: true }) });

const expandItem = async (page: Page, title: string) => {
	const chevron = navItem(page, title).locator(".angle");
	await expect(chevron).toBeVisible();
	await chevron.click();
	await page.waitForTimeout(250);
};

// Reveal a row by toggling its parent section's chevron until the row appears.
// Robust against the parent being already expanded (or auto-expanded after a drop).
const reveal = async (page: Page, parentTitle: string, childTitle: string) => {
	const child = navItem(page, childTitle);
	for (let i = 0; i < 3; i++) {
		if (await child.isVisible().catch(() => false)) return;
		await navItem(page, parentTitle).locator(".angle").click();
		await page.waitForTimeout(250);
	}
	await expect(child).toBeVisible();
};

// While a row is the active "into" drop target, dnd-kit highlights it with the
// bg-secondary-bg-hover class. We use that as the public signal that releasing
// now will nest the dragged item into this row.
const isDropHighlighted = (item: Locator): Promise<boolean> =>
	item
		.locator(".bg-secondary-bg-hover")
		.count()
		.then((n) => n > 0);

/**
 * The navigation tree uses @dnd-kit. The drop mode (into / after) flips within a
 * narrow (~4px) band over a row, so dropping at a fixed coordinate is flaky.
 * Instead we press on the source, move down the target row 1px at a time, and
 * release only once the target row shows the "into" highlight. This keeps the
 * gesture deterministic regardless of sub-pixel layout and relies only on
 * observable DOM — no app internals.
 *
 * Dropping "into" the parent of a row inserts the dragged item as the parent's
 * first child, i.e. before that row (order 0.5); dropping "into" a section nests
 * the dragged item inside it.
 */
const dragInto = async (page: Page, source: Locator, target: Locator) => {
	const sBox = (await source.boundingBox())!;
	const sx = sBox.x + sBox.width / 2;
	const sy = sBox.y + sBox.height / 2;

	await page.mouse.move(sx, sy);
	await page.mouse.down();
	// cross the PointerSensor activation distance (8px) to start dragging
	await page.mouse.move(sx, sy + 12, { steps: 4 });
	await page.waitForTimeout(50);

	const tBox = (await target.boundingBox())!;
	const tx = tBox.x + 50;
	let highlighted = false;
	for (let y = tBox.y - 4; y <= tBox.y + tBox.height + 4 && !highlighted; y += 1) {
		await page.mouse.move(tx, y, { steps: 1 });
		await page.waitForTimeout(45);
		highlighted = await isDropHighlighted(target);
	}
	expect(highlighted, "expected the target row to become the 'into' drop target").toBe(true);

	await page.mouse.up();
	await page.waitForTimeout(400);
};

const orderOf = async (
	page: Page,
	catalogPage: {
		waitForLoad: () => Promise<unknown>;
		currentArticleProps: () => Promise<{ order?: number; title?: string }>;
	},
	title: string,
) => {
	await navItem(page, title).getByTitle(title, { exact: true }).click();
	await catalogPage.waitForLoad();
	return (await catalogPage.currentArticleProps()).order;
};

catalogTest.describe("Drag and drop in the navigation tree", () => {
	// each test mutates the catalog tree; reload so the SPA re-reads the freshly
	// reset file tree (the isolated fixture rewrites files but doesn't invalidate
	// the running catalog cache) and start from a clean expansion state
	catalogTest.beforeEach(async ({ sharedPage, catalogPage }) => {
		await sharedPage.evaluate(() => localStorage.removeItem("nav-tree-state"));
		await sharedPage.reload();
		await catalogPage.waitForLoad();
	});

	catalogTest("reorders a section before its sibling", async ({ catalogPage, sharedPage }) => {
		const page = sharedPage;
		await catalogPage.waitForLoad();
		await expandItem(page, "Раздел 2 уровня");

		// dropping "Второй раздел" (order 2) onto its parent makes it the first
		// child — i.e. before "Первый раздел" (order 1) → order 0.5
		await expect(navItem(page, "Второй раздел 3 уровня")).toBeVisible();
		await dragInto(page, navItem(page, "Второй раздел 3 уровня"), navItem(page, "Раздел 2 уровня"));

		expect(await orderOf(page, catalogPage, "Второй раздел 3 уровня")).toBe(0.5);
	});

	catalogTest("nests an article into a sibling section", async ({ catalogPage, sharedPage }) => {
		const page = sharedPage;
		await catalogPage.waitForLoad();
		await expandItem(page, "Раздел 2 уровня");
		await reveal(page, "Первый раздел 3 уровня", "Статья 2 уровня");

		await dragInto(page, navItem(page, "Статья 2 уровня"), navItem(page, "Второй раздел 3 уровня"));

		// the article now lives inside "Второй раздел"; reveal it (drop may auto-expand)
		await reveal(page, "Второй раздел 3 уровня", "Статья 2 уровня");

		// it became the first child of "Второй раздел" (before its existing child) → order 0.5
		expect(await orderOf(page, catalogPage, "Статья 2 уровня")).toBe(0.5);
	});

	catalogTest("reorders a root section before its sibling", async ({ catalogPage, sharedPage }) => {
		const page = sharedPage;
		await catalogPage.waitForLoad();

		// "git" (root, order 2) dropped onto "catalog" (root, order 1) lands before it
		await expect(navItem(page, "git")).toBeVisible();
		await dragInto(page, navItem(page, "git"), navItem(page, "catalog"));

		expect(await orderOf(page, catalogPage, "git")).toBe(0.5);
	});
});
