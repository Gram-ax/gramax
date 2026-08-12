import { expect } from "@playwright/test";
import { editorTest } from "@web/fixtures/editor.fixture";

const IMAGE_FIXTURE = new URL("./data/img.png", import.meta.url);

editorTest.describe("Images", () => {
	editorTest("copies an inserted image from the article", async ({ editor, basePage, sharedPage }) => {
		await basePage.copyFileToClipboard(IMAGE_FIXTURE);
		await editor.press("ControlOrMeta+V");

		const images = sharedPage.getByTestId("image");
		await expect(images).toHaveCount(1);

		await sharedPage.evaluate(() => navigator.clipboard.writeText("not an image"));
		await images.first().click();
		await editor.press("ControlOrMeta+C ArrowRight Enter Enter ControlOrMeta+V");

		await expect(images).toHaveCount(2);
		await editor.forceSave();
		await expect(editor.markdown()).resolves.toMatch(
			/^!\[\]\(\.\/untitled\.jpeg\)\{width=50px height=50px\}\s+!\[\]\(\.\/untitled-\d+\.jpeg\)\{width=50px height=50px\}\s*$/,
		);
	});

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

![](./untitled.jpeg){width=50px height=50px}

2after
		`,
			{ ignoreTabs: true },
		);
	});
});
