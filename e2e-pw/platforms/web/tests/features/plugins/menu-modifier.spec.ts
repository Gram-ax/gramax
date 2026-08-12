import { catalogTest } from "@web/fixtures/catalog.fixture";
import { CATALOG, MENU_PLUGIN_JS, pluginDir, workspacePlugins } from "./helpers";

catalogTest.use({
	startUrl: "/test-catalog",
	files: {
		...CATALOG,
		...workspacePlugins({ "menu-plugin": pluginDir("menu-plugin", MENU_PLUGIN_JS) }),
	},
});

catalogTest.describe("Menu modifier plugin", () => {
	catalogTest.beforeEach(async ({ catalogPage }) => {
		await catalogPage.raw.reload({ waitUntil: "domcontentloaded" });
		await catalogPage.waitForLoad();
	});

	catalogTest("adds a custom item to catalog actions menu", async ({ catalogPage }) => {
		const actions = await catalogPage.getCatalogActions();
		await actions.open();
		await actions.assertHasItem({ title: "Plugin Test Action" });
	});
});
