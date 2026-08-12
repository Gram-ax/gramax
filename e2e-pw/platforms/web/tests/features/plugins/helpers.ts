import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { FileTree } from "@web/utils";

export const TRACKER_PLUGIN_JS = `
import { Plugin } from "@gramax/sdk";
export default class TrackerPlugin extends Plugin {
  onload() {
    window.__trackerPlugin = { loaded: true, articleOpenFired: false };
    this.ctx.events.on("article:open", () => {
      if (window.__trackerPlugin) window.__trackerPlugin.articleOpenFired = true;
    });
  }
  onunload() {
    if (window.__trackerPlugin) window.__trackerPlugin.loaded = false;
  }
}
`.trim();

export const MENU_PLUGIN_JS = `
import { Plugin } from "@gramax/sdk";
import { MenuItem } from "@gramax/sdk/ui";
class TestAction extends MenuItem {
  constructor() { super("plugin-test-action"); }
  getLabel() { return "Plugin Test Action"; }
  getIcon() { return "plug"; }
  getOnClick() { return () => {}; }
}
export default class MenuPlugin extends Plugin {
  onload() {
    this.ctx.ui.menus.registerModifier((items) => [
      ...items,
      { id: "plugin-test-action", visible: true, component: new TestAction() },
    ]);
  }
}
`.trim();

export const SENTINEL_PLUGIN_JS = `
import { Plugin } from "@gramax/sdk";
export default class SentinelPlugin extends Plugin {
  onload() { window.__sentinelLoaded = true; }
}
`.trim();

export type TestWindow = Window &
	typeof globalThis & {
		// biome-ignore lint/style/useNamingConvention: test globals use double-underscore convention
		__trackerPlugin?: { loaded: boolean; articleOpenFired: boolean };
		// biome-ignore lint/style/useNamingConvention: test globals use double-underscore convention
		__sentinelLoaded?: boolean;
	};

export const CATALOG: FileTree = {
	"test-catalog": {
		"doc-root.yml": "title: Test Catalog\nsyntax: MarkdownIt\n",
		"index.md": "# Test Article\n",
	},
};

export const meta = (id: string, extra: Record<string, unknown> = {}) =>
	JSON.stringify({ id, name: id, version: "0.1.0", platform: [], styles: [], disabled: false, ...extra });

/** Returns the file contents for a single plugin folder. */
export const pluginDir = (id: string, js: string, metaExtra: Record<string, unknown> = {}): FileTree => ({
	"_metadata.json": meta(id, metaExtra),
	[`${id}.js`]: js,
});

/**
 * Wraps a map of { pluginId → pluginDir contents } into the workspace path
 * that PluginsAsset reads from: `.workspace/assets/plugins/<id>/`.
 */
export const workspacePlugins = (plugins: Record<string, FileTree>): FileTree => ({
	".workspace": { assets: { plugins } },
});

export const waitForSentinel = async (page: Page) =>
	expect.poll(() => page.evaluate(() => (window as TestWindow).__sentinelLoaded), { timeout: 10_000 }).toBe(true);
