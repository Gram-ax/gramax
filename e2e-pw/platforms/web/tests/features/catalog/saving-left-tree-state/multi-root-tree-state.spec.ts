import { expect, type Page } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

const multiRootCatalogFiles = {
	"multi-root": {
		"doc-root.yml": "title: Multi Root\nsyntax: MarkdownIt\nsupportedLanguages: []\n",
		"_index.md": "---\ntitle: Root Article\n---\n\nRoot content.\n",
		"must-stay-closed": {
			"_index.md": "---\ntitle: Must Stay Closed\n---\n\nMust stay closed content.\n",
			"child-one": {
				"_index.md": "---\ntitle: Child One\n---\n\nChild one content.\n",
				"grand-child.md": "---\ntitle: Grand Child One\n---\n\nGrand child content.\n",
			},
			"child-two": {
				"_index.md": "---\ntitle: Child Two\n---\n\nChild two content.\n",
				"grand-child.md": "---\ntitle: Grand Child Two\n---\n\nGrand child content.\n",
			},
			"loose-article.md": "---\ntitle: Loose Article\n---\n\nLoose article content.\n",
		},
		"for-testing": {
			"_index.md": "---\ntitle: For Testing\n---\n\nFor testing content.\n",
			"leaf.md": "---\ntitle: For Testing Leaf\n---\n\nLeaf content.\n",
		},
	},
};

const MUST_STAY_CLOSED_PATH = "multi-root/must-stay-closed/_index.md";
const FOR_TESTING_PATH = "multi-root/for-testing/_index.md";
const CHILD_ONE_PATH = "multi-root/must-stay-closed/child-one/_index.md";
const CHILD_TWO_PATH = "multi-root/must-stay-closed/child-two/_index.md";

catalogTest.use({
	startUrl: "/multi-root",
	files: multiRootCatalogFiles,
	isolated: true,
});

// Scoped to [data-qa^="catalog-navigation"] so it never matches content-area headings.
const toggle = (page: Page, title: string) =>
	page
		.locator('[data-qa^="catalog-navigation"]')
		.filter({ has: page.getByTitle(title, { exact: true }) })
		.locator(".angle");

catalogTest.describe("Multi-root left tree state", () => {
	catalogTest.describe.configure({ mode: "serial" });

	catalogTest.beforeEach(async ({ sharedPage, catalogPage }) => {
		await sharedPage.evaluate(() => localStorage.removeItem("nav-tree-state"));
		await sharedPage.goto("/-/-/-/-/multi-root/must-stay-closed");
		await catalogPage.waitForLoad();
	});

	catalogTest(
		"regression: collapsed sibling root stays collapsed when navigating to other root",
		async ({ catalogPage, sharedPage }) => {
			await expect(sharedPage.getByTitle("Must Stay Closed", { exact: true })).toBeVisible();
			await expect(sharedPage.getByTitle("Child One", { exact: true })).toBeVisible();
			await expect(sharedPage.getByTitle("Child Two", { exact: true })).toBeVisible();

			await toggle(sharedPage, "Must Stay Closed").click();
			await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
			await expect(sharedPage.getByTitle("Child Two", { exact: true })).not.toBeVisible();

			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);

			await sharedPage.getByTitle("For Testing", { exact: true }).click();
			await sharedPage.waitForURL(/for-testing/);
			await catalogPage.waitForLoad();

			await expect(sharedPage.getByTitle("For Testing Leaf", { exact: true })).toBeVisible();
			await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
			await expect(sharedPage.getByTitle("Child Two", { exact: true })).not.toBeVisible();
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);
		},
	);

	catalogTest(
		"collapsed sibling root stays collapsed after expanding-then-collapsing a child",
		async ({ catalogPage, sharedPage }) => {
			await toggle(sharedPage, "Child One").click();
			await expect(sharedPage.getByTitle("Grand Child One", { exact: true })).toBeVisible();
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).toContain(CHILD_ONE_PATH);

			await toggle(sharedPage, "Must Stay Closed").click();
			await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(CHILD_ONE_PATH);

			await sharedPage.getByTitle("For Testing", { exact: true }).click();
			await sharedPage.waitForURL(/for-testing/);
			await catalogPage.waitForLoad();

			await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);
		},
	);

	catalogTest("collapsed root persists across reload AND across navigation", async ({ catalogPage, sharedPage }) => {
		await toggle(sharedPage, "Must Stay Closed").click();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
		await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);

		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();

		await sharedPage.getByTitle("For Testing", { exact: true }).click();
		await sharedPage.waitForURL(/for-testing/);
		await catalogPage.waitForLoad();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();

		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
	});

	catalogTest(
		"saved collapse state wins over server hints when navigating directly to a deep leaf URL",
		async ({ catalogPage, sharedPage }) => {
			await toggle(sharedPage, "Must Stay Closed").click();
			await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);

			await sharedPage.goto("/-/-/-/-/multi-root/must-stay-closed/child-one/grand-child");
			await catalogPage.waitForLoad();

			await expect(sharedPage.getByTitle("Grand Child One", { exact: true })).not.toBeVisible();
			await expect(sharedPage.getByTitle("Grand Child Two", { exact: true })).not.toBeVisible();
			await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();

			await sharedPage.getByTitle("For Testing", { exact: true }).click();
			await sharedPage.waitForURL(/for-testing/);
			await catalogPage.waitForLoad();

			await expect(sharedPage.getByTitle("Grand Child One", { exact: true })).not.toBeVisible();
			await expect(sharedPage.getByTitle("Grand Child Two", { exact: true })).not.toBeVisible();
		},
	);

	catalogTest("expanding both roots then collapsing one preserves the other", async ({ catalogPage, sharedPage }) => {
		await expect(sharedPage.getByTitle("For Testing Leaf", { exact: true })).toBeVisible();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).toBeVisible();

		await toggle(sharedPage, "Must Stay Closed").click();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
		await expect(sharedPage.getByTitle("For Testing Leaf", { exact: true })).toBeVisible();
		await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);

		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(sharedPage.getByTitle("For Testing Leaf", { exact: true })).toBeVisible();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();

		await toggle(sharedPage, "Must Stay Closed").click();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).toBeVisible();
		await expect(sharedPage.getByTitle("For Testing Leaf", { exact: true })).toBeVisible();

		await toggle(sharedPage, "For Testing").click();
		await expect(sharedPage.getByTitle("For Testing Leaf", { exact: true })).not.toBeVisible();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).toBeVisible();
		await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(FOR_TESTING_PATH);
	});

	catalogTest(
		"collapsing a root removes ALL descendants (not only direct children) from saved state",
		async ({ catalogPage, sharedPage }) => {
			await toggle(sharedPage, "Child One").click();
			await expect(sharedPage.getByTitle("Grand Child One", { exact: true })).toBeVisible();
			await toggle(sharedPage, "Child Two").click();
			await expect(sharedPage.getByTitle("Grand Child Two", { exact: true })).toBeVisible();

			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).toContain(CHILD_ONE_PATH);
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).toContain(CHILD_TWO_PATH);

			await toggle(sharedPage, "Must Stay Closed").click();

			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(CHILD_ONE_PATH);
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(CHILD_TWO_PATH);
		},
	);

	catalogTest(
		"re-expanding a previously-collapsed root does NOT magically restore inner expanded children",
		async ({ catalogPage, sharedPage }) => {
			await toggle(sharedPage, "Child One").click();
			await expect(sharedPage.getByTitle("Grand Child One", { exact: true })).toBeVisible();

			await toggle(sharedPage, "Must Stay Closed").click();
			await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();

			await toggle(sharedPage, "Must Stay Closed").click();
			await expect(sharedPage.getByTitle("Child One", { exact: true })).toBeVisible();
			await expect(sharedPage.getByTitle("Grand Child One", { exact: true })).not.toBeVisible();

			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).toContain(MUST_STAY_CLOSED_PATH);
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(CHILD_ONE_PATH);
		},
	);

	catalogTest("browser back/forward navigation preserves saved tree state", async ({ catalogPage, sharedPage }) => {
		await toggle(sharedPage, "Must Stay Closed").click();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();

		await sharedPage.getByTitle("For Testing", { exact: true }).click();
		await sharedPage.waitForURL(/for-testing/);
		await catalogPage.waitForLoad();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();

		await sharedPage.goBack();
		await catalogPage.waitForLoad();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();

		await sharedPage.goForward();
		await catalogPage.waitForLoad();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
	});

	catalogTest("explicit collapse overrides keep roots collapsed on load", async ({ catalogPage, sharedPage }) => {
		await sharedPage.evaluate(
			({ msc, ft }) => {
				localStorage.setItem(
					"nav-tree-state",
					JSON.stringify({
						state: { catalogs: { "multi-root": { [msc]: false, [ft]: false } } },
						version: 1,
					}),
				);
			},
			{ msc: MUST_STAY_CLOSED_PATH, ft: FOR_TESTING_PATH },
		);

		await sharedPage.goto("/multi-root");
		await catalogPage.waitForLoad();

		await expect(sharedPage.getByTitle("Must Stay Closed", { exact: true })).toBeVisible();
		await expect(sharedPage.getByTitle("For Testing", { exact: true })).toBeVisible();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
		await expect(sharedPage.getByTitle("For Testing Leaf", { exact: true })).not.toBeVisible();
	});

	catalogTest(
		"legacy v0 saved state is discarded on load (defaults apply, old collapse forgotten)",
		async ({ sharedPage, catalogPage }) => {
			await sharedPage.evaluate(() => {
				localStorage.setItem(
					"nav-tree-state",
					JSON.stringify({ state: { catalogs: { "multi-root": [] } }, version: 0 }),
				);
			});

			await sharedPage.goto("/multi-root");
			await catalogPage.waitForLoad();

			await expect(sharedPage.getByTitle("Child One", { exact: true })).toBeVisible();
			await expect(sharedPage.getByTitle("Child Two", { exact: true })).toBeVisible();

			const raw = await sharedPage.evaluate(() => window.localStorage.getItem("nav-tree-state"));
			expect(raw).not.toContain('"multi-root":[');
		},
	);

	catalogTest(
		"first visit (no saved state) defaults to root-categories-open",
		async ({ catalogPage, sharedPage }) => {
			await sharedPage.evaluate(() => localStorage.removeItem("nav-tree-state"));
			await sharedPage.goto("/multi-root");
			await catalogPage.waitForLoad();

			await expect(sharedPage.getByTitle("Child One", { exact: true })).toBeVisible();
			await expect(sharedPage.getByTitle("Child Two", { exact: true })).toBeVisible();
		},
	);

	catalogTest(
		"deep nesting: expanding child + grand-child persists across reload",
		async ({ catalogPage, sharedPage }) => {
			await toggle(sharedPage, "Child One").click();
			await expect(sharedPage.getByTitle("Grand Child One", { exact: true })).toBeVisible();
			await expect.poll(() => catalogPage.getNavTreeState("multi-root")).toContain(CHILD_ONE_PATH);

			await sharedPage.reload();
			await catalogPage.waitForLoad();

			await expect(sharedPage.getByTitle("Grand Child One", { exact: true })).toBeVisible();
		},
	);

	catalogTest("rapid toggle of the same root settles in the final state", async ({ catalogPage, sharedPage }) => {
		await toggle(sharedPage, "Must Stay Closed").click();
		await toggle(sharedPage, "Must Stay Closed").click();
		await toggle(sharedPage, "Must Stay Closed").click();

		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
		await expect.poll(() => catalogPage.getNavTreeState("multi-root")).not.toContain(MUST_STAY_CLOSED_PATH);

		await sharedPage.reload();
		await catalogPage.waitForLoad();
		await expect(sharedPage.getByTitle("Child One", { exact: true })).not.toBeVisible();
	});
});
