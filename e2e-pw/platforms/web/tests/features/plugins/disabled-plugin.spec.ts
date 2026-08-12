import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";
import {
	CATALOG,
	pluginDir,
	SENTINEL_PLUGIN_JS,
	type TestWindow,
	TRACKER_PLUGIN_JS,
	waitForSentinel,
	workspacePlugins,
} from "./helpers";

catalogTest.use({
	startUrl: "/test-catalog",
	files: {
		...CATALOG,
		...workspacePlugins({
			"tracker-plugin": pluginDir("tracker-plugin", TRACKER_PLUGIN_JS, { disabled: true }),
			sentinel: pluginDir("sentinel", SENTINEL_PLUGIN_JS),
		}),
	},
});

catalogTest.describe("Disabled plugin", () => {
	catalogTest.beforeEach(async ({ catalogPage }) => {
		await catalogPage.raw.reload({ waitUntil: "domcontentloaded" });
		await catalogPage.waitForLoad();
	});

	catalogTest("disabled plugin is not loaded", async ({ catalogPage }) => {
		await waitForSentinel(catalogPage.raw);
		const trackerPlugin = await catalogPage.raw.evaluate(() => (window as TestWindow).__trackerPlugin);
		expect(trackerPlugin).toBeUndefined();
	});
});
