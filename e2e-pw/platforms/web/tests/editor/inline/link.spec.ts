import { expect } from "@playwright/test";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Link", () => {
	const linkExample = "https://www.lipsum.com";
	editorTest("delete link in article text properly dont move focus to link", async ({ editor }) => {
		await editor.type(linkExample);

		await editor.assertMarkdownContains(linkExample);

		await Promise.all(Array.from({ length: linkExample.length }, () => editor.press("Backspace")));

		await editor.assertMarkdown("");
	});

	editorTest("select word and apply link via inline toolbar", async ({ editor, catalogPage }) => {
		await editor.type("Hello");
		await editor.press("Shift+Home");

		const inlineToolbar = catalogPage.raw.locator('[role="article-inline-toolbar"]');
		await expect(inlineToolbar).toBeVisible();
		await inlineToolbar.locator('[data-qa="link-button"]').click();

		const linkInput = catalogPage.raw.getByPlaceholder("Enter link or search for articles");
		await expect(linkInput).toBeVisible();
		await linkInput.fill(linkExample);

		await catalogPage.raw.keyboard.press("ArrowDown");
		await catalogPage.raw.locator('[data-slot="command-item"][data-selected="true"]').click();

		await editor.press("Backspace");

		const linkToolbar = catalogPage.raw.locator('[role="link-toolbar"]');
		await expect(linkToolbar).toContainText(linkExample);
	});

	editorTest(
		"link syncs with text only when they match — extra char prevents sync until removed",
		async ({ editor, catalogPage }) => {
			const textWithExtra = `${linkExample}X`;

			await editor.type(textWithExtra);
			await editor.press("Shift+Home");

			const inlineToolbar = catalogPage.raw.locator('[role="article-inline-toolbar"]');
			await expect(inlineToolbar).toBeVisible();
			await inlineToolbar.locator('[data-qa="link-button"]').click();

			const linkInput = catalogPage.raw.getByPlaceholder("Enter link or search for articles");
			await expect(linkInput).toBeVisible();
			await linkInput.fill(linkExample);

			await catalogPage.raw.keyboard.press("ArrowDown");
			await catalogPage.raw.locator('[data-slot="command-item"][data-selected="true"]').click();

			await editor.press("Backspace");

			const linkToolbar = catalogPage.raw.locator('[role="link-toolbar"]');
			await expect(linkToolbar).toContainText(linkExample);

			await editor.press("Backspace");

			await expect(linkToolbar).toContainText(linkExample.slice(0, -1));
		},
	);

	editorTest("edit link text in article also changes link if they're the same", async ({ editor, catalogPage }) => {
		await editor.pasteText(linkExample);

		await editor.assertMarkdownContains(linkExample);

		const linkToolbar = catalogPage.raw.locator('[role="link-toolbar"]');
		await expect(linkToolbar).toBeVisible();
		await expect(linkToolbar).toHaveText(linkExample);

		await editor.press("Backspace");

		await expect(linkToolbar).toHaveText(linkExample.slice(0, -1));
	});
});
