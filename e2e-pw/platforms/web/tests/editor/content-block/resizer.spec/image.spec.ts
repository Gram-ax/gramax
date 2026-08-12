import { expect } from "@playwright/test";
import { resizerTest } from "@web/tests/editor/content-block/resizer.spec/resizer.fixture";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const IMAGE_PATH = new URL("../data/img.png", import.meta.url);
const IMAGE_BYTES: number[] = Array.from(readFileSync(fileURLToPath(IMAGE_PATH)));

const IMAGE_MD = '<image src="./img.png" crop="0,0,100,100" scale="50" width="50" height="50" float="center"/>';

resizerTest.use({
	files: {
		editor: {
			"untitled.md": "",
			"img.png": IMAGE_BYTES,
			"doc-root.yml": "syntax: xml\n",
		},
	},
	firstEnter: false,
});

resizerTest.describe("Resizer — Image", () => {
	resizerTest("resizer appears when image is selected", async ({ editor, sharedPage, resizer }) => {
		await editor.setMarkdown(IMAGE_MD);

		const img = sharedPage.getByTestId("image");
		await expect(img).toBeVisible();
		await img.click();

		await expect(resizer).toHaveAttribute("aria-hidden", "false");
	});

	resizerTest("resizer is hidden when image is not selected", async ({ editor, sharedPage, resizer }) => {
		await editor.setMarkdown(IMAGE_MD);

		const img = sharedPage.getByTestId("image");
		await expect(img).toBeVisible();
		await img.click();

		await editor.press("Escape");
		await sharedPage.locator('[data-testid="article-editor"]').click({ position: { x: 10, y: 5 } });

		await expect(resizer).toHaveAttribute("aria-hidden", "true");
	});

	resizerTest(
		"drag resizer saves updated scale to markdown",
		async ({ editor, sharedPage, resizer, dragResizer }) => {
			await editor.setMarkdown(IMAGE_MD);

			const img = sharedPage.getByTestId("image");
			await expect(img).toBeVisible();
			await img.click();

			await expect(resizer).toHaveAttribute("aria-hidden", "false");

			await dragResizer(60);
			await editor.forceSave();

			await editor.assertMarkdownContains(/scale="\d+px"/);
		},
	);

	resizerTest(
		"drag resizer far right snaps to full width and saves scale ≥ 100",
		async ({ editor, sharedPage, resizer, dragResizer }) => {
			await editor.setMarkdown(IMAGE_MD);

			const img = sharedPage.getByTestId("image");
			await expect(img).toBeVisible();
			await img.click();

			await expect(resizer).toHaveAttribute("aria-hidden", "false");

			await dragResizer(2000);
			await editor.forceSave();

			const md = await editor.markdown();
			const match = md.match(/scale="(\d+px)"/);
			expect(match).not.toBeNull();
			if (!match?.[1]) return;
			expect(parseInt(match[1], 10)).toBeGreaterThanOrEqual(100);
		},
	);
});
