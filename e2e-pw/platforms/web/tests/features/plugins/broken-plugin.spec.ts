import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";
import { CATALOG, meta, workspacePlugins } from "./helpers";

// PluginsAsset.get() returns null when the script file is absent.
// The plugin ID lands in the `errors` array → onPluginLoadError fires → toast.

catalogTest.use({
	startUrl: "/test-catalog",
	files: {
		...CATALOG,
		...workspacePlugins({
			"broken-plugin": {
				"_metadata.json": meta("broken-plugin"),
				// intentionally no "broken-plugin.js" — missing script triggers onPluginLoadError
			},
		}),
	},
});

catalogTest.describe("Broken plugin", () => {
	catalogTest("shows error toast when plugin script is missing", async ({ catalogPage }) => {
		await expect(catalogPage.raw.getByText("Failed to load broken-plugin module")).toBeVisible({
			timeout: 10_000,
		});
	});
});
