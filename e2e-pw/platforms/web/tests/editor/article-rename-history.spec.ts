import { expect } from "@playwright/test";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Article rename – browser history", () => {
	editorTest.use({ firstEnter: false });

	editorTest(
		"renaming a new article replaces its history entry instead of adding a new one",
		async ({ editor, sharedPage, basePage }) => {
			expect(basePage.url).toContain("new-article");

			await editor.type("Renamed Article");
			await editor.press("End ArrowDown");

			await sharedPage.waitForURL(/renamed-article/, { timeout: 15_000 });

			expect(basePage.url).toContain("renamed-article");
			expect(basePage.url).not.toContain("new-article");

			await sharedPage.goBack();
			await sharedPage.waitForLoadState("domcontentloaded");

			expect(basePage.url).not.toContain("new-article");
			expect(basePage.url).not.toContain("renamed-article");
		},
	);

	editorTest(
		"URL is updated synchronously after title blur without an intermediate new-article entry",
		async ({ editor, sharedPage, basePage }) => {
			expect(basePage.url).toContain("new-article");

			const historyLengthBefore = await sharedPage.evaluate(() => window.history.length);

			await editor.type("Another Title");
			await editor.press("End ArrowDown");

			await sharedPage.waitForURL(/another-title/, { timeout: 15_000 });

			const historyLengthAfter = await sharedPage.evaluate(() => window.history.length);
			expect(historyLengthAfter).toBe(historyLengthBefore);
		},
	);
});
