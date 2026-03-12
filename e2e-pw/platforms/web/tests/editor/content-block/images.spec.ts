import { expect } from "@playwright/test";
import { editorTest } from "@web/fixtures/editor.fixture";

const IMAGE_FIXTURE = new URL("./data/img.png", import.meta.url);

editorTest.describe("Images", () => {
	editorTest("paste image from clipboard & navigate", async ({ editor, basePage, sharedPage }) => {
		await editor.type("before");
		await editor.press("Enter");

		await basePage.copyFileToClipboard(IMAGE_FIXTURE);
		await editor.press("ControlOrMeta+V");
		await expect(sharedPage.locator(".image-container img")).toBeVisible();

		await editor.press("Enter");
		await editor.type("after");

		await editor.press("ArrowUp ArrowUp");
		await editor.type("1");
		await editor.press("ArrowDown ArrowDown");
		await editor.type("2");

		await expect(sharedPage.locator(".alert-error")).toHaveCount(0);
		await expect(sharedPage.locator(".image-container img")).toBeVisible();

		await editor.assertMarkdown(
			`
before1

![](./new-article.png){width=50px height=50px}

2after
		`,
			{ ignoreTabs: true },
		);
	});
});
