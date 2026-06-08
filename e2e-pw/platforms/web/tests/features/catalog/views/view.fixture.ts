import { catalogTest } from "@web/fixtures/catalog.fixture";
import { expect, type Page } from "playwright/test";

export const VIEW_ID = "K6gH5";

const getViewsTrigger = (page: Page) => page.locator('.article-right-sidebar [aria-haspopup="dialog"]');

const openViewsPopover = async (page: Page) => {
	const trigger = getViewsTrigger(page);
	await expect(trigger).toBeVisible({ timeout: 10000 });
	await trigger.click({ timeout: 10000 });
};

const clickViewItem = async (page: Page) => {
	const viewItem = page.getByTestId("catalog-view-item").nth(0);
	await expect(viewItem).toBeVisible({ timeout: 10000 });
	await viewItem.click({ timeout: 10000 });
};

export type ViewFixture = {
	applyView: () => Promise<void>;
	removeView: () => Promise<void>;
	openViewsPopover: () => Promise<void>;
	closeViewsPopover: () => Promise<void>;
};

export const viewTest = catalogTest.extend<ViewFixture>({
	openViewsPopover: async ({ sharedPage }, use) => {
		await use(() => openViewsPopover(sharedPage));
	},

	closeViewsPopover: async ({ sharedPage }, use) => {
		await use(async () => {
			await sharedPage.keyboard.press("Escape");
			await expect(getViewsTrigger(sharedPage)).toHaveAttribute("data-state", "closed");
		});
	},

	applyView: async ({ sharedPage, catalogPage }, use) => {
		await use(async () => {
			await openViewsPopover(sharedPage);
			await clickViewItem(sharedPage);
			await sharedPage.waitForURL((url) => url.searchParams.has("view"), { timeout: 10000 });
			await catalogPage.waitForLoad();
		});
	},

	removeView: async ({ sharedPage, catalogPage }, use) => {
		await use(async () => {
			await openViewsPopover(sharedPage);
			await clickViewItem(sharedPage);
			await sharedPage.waitForURL((url) => !url.searchParams.has("view"), { timeout: 10000 });
			await catalogPage.waitForLoad();
		});
	},
});
