import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";
import { CATALOG, pluginDir, type TestWindow, TRACKER_PLUGIN_JS, workspacePlugins } from "./helpers";

catalogTest.use({
	startUrl: "/test-catalog",
	files: {
		...CATALOG,
		...workspacePlugins({ "tracker-plugin": pluginDir("tracker-plugin", TRACKER_PLUGIN_JS) }),
	},
});

catalogTest.describe("Plugin lifecycle", () => {
	// Reload clears the bootstrap dedup state so plugins load fresh after files are written.
	catalogTest.beforeEach(async ({ catalogPage }) => {
		await catalogPage.raw.reload({ waitUntil: "domcontentloaded" });
		await catalogPage.waitForLoad();
	});

	catalogTest("loads and sets window state on boot", async ({ catalogPage }) => {
		await expect
			.poll(() => catalogPage.raw.evaluate(() => (window as TestWindow).__trackerPlugin?.loaded), {
				timeout: 10_000,
			})
			.toBe(true);
	});

	catalogTest("persists across a page reload", async ({ catalogPage }) => {
		await expect
			.poll(() => catalogPage.raw.evaluate(() => (window as TestWindow).__trackerPlugin?.loaded), {
				timeout: 10_000,
			})
			.toBe(true);

		await catalogPage.raw.reload({ waitUntil: "domcontentloaded" });
		await catalogPage.waitForLoad();

		await expect
			.poll(() => catalogPage.raw.evaluate(() => (window as TestWindow).__trackerPlugin?.loaded), {
				timeout: 10_000,
			})
			.toBe(true);
	});

	catalogTest("fires article:open event when article is rendered", async ({ catalogPage }) => {
		await expect
			.poll(() => catalogPage.raw.evaluate(() => (window as TestWindow).__trackerPlugin?.articleOpenFired), {
				timeout: 10_000,
			})
			.toBe(true);
	});
});
