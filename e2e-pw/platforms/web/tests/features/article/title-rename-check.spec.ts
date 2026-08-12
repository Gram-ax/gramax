import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

// Placeholder article (untitled/new_article_*) must still be renamed to the title slug
// after the user actually types a title and leaves the title line.

catalogTest.use({
	startUrl: "/rename-check/start",
	files: {
		"rename-check": {
			"doc-root.yml": "title: Rename Check\n",
			"start.md": "---\ntitle: Start\n---\n\nstub",
		},
	},
});

catalogTest("typing a title renames a placeholder article", async ({ basePage, sharedPage }) => {
	await basePage.waitForLoad();

	await sharedPage.getByTestId("create-article").last().click();
	await basePage.waitForLoad();
	expect(sharedPage.url()).toContain("untitled");

	await sharedPage.keyboard.type("My Fancy Title");
	await sharedPage.keyboard.press("Enter");
	await sharedPage.keyboard.type("body text");

	await expect(async () => {
		expect(sharedPage.url()).toContain("my-fancy-title");
	}).toPass({ timeout: 10_000 });
});
