import { expect } from "playwright/test";
import { VIEW_ID, viewTest } from "./view.fixture";

viewTest.use({
	startUrl: "/view-test-catalog",
	dir: new URL(".", import.meta.url),
	isolated: true,
});

viewTest.describe("View query param", () => {
	viewTest("adds ?view param to URL after applying view", async ({ catalogPage, sharedPage, applyView }) => {
		await catalogPage.waitForLoad();

		await applyView();

		const url = new URL(sharedPage.url());
		expect(url.searchParams.get("view")).toBe(VIEW_ID);
	});

	viewTest(
		"preserves ?view param when navigating between articles",
		async ({ catalogPage, sharedPage, applyView }) => {
			await catalogPage.waitForLoad();

			await applyView();

			await sharedPage.getByText("Second children category one").click();
			await catalogPage.waitForLoad();

			const url = new URL(sharedPage.url());
			expect(url.searchParams.get("view")).toBe(VIEW_ID);
		},
	);

	viewTest(
		"removes ?view param after removing view",
		async ({ catalogPage, applyView, removeView, sharedPage, closeViewsPopover }) => {
			await catalogPage.waitForLoad();

			await applyView();
			await closeViewsPopover();
			await removeView();

			const url = new URL(sharedPage.url());
			expect(url.searchParams.has("view")).toBe(false);
		},
	);

	viewTest("applies view on page load when ?view param is present", async ({ sharedPage, basePage }) => {
		await basePage.goto(`/view-test-catalog?view=${VIEW_ID}`);
		await basePage.waitForLoad();

		expect(await sharedPage.getByText("Second children category one").isVisible()).toBe(true);
		expect(await sharedPage.getByText("First children category one").isVisible()).toBe(false);
	});
});
