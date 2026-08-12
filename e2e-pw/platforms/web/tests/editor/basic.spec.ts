import { editorTest } from "@web/fixtures/editor.fixture";
import { expect } from "playwright/test";

editorTest.describe("Basic Text", () => {
	editorTest("delete all text", async ({ editor }) => {
		await editor.setMarkdown("Hello(*)");
		await editor.press("ControlOrMeta+A Backspace");
		await editor.assertMarkdown("");
	});

	editorTest("write text", async ({ editor }) => {
		await editor.type("Hello");
		await editor.assertMarkdownContains("Hello");
	});

	editorTest("copy-paste text", async ({ editor }) => {
		await editor.setMarkdown("Hello(*)");
		await editor.press("ControlOrMeta+Shift+ArrowLeft ControlOrMeta+C ArrowRight ControlOrMeta+V");
		await editor.assertMarkdownContains("HelloHello");
	});

	editorTest("delete text with backspace", async ({ editor }) => {
		await editor.setMarkdown("Hello!(*)");
		await editor.press("Backspace");
		await editor.assertMarkdownContains("Hello");
	});

	editorTest("edit article with error 500", async ({ editor, sharedPage, basePage }) => {
		await editor.setMarkdown("[/note]", { skipAssertMarkdownValid: true });
		await editor.assertMarkdown("[/note]", { skipAssertMarkdownValid: true });

		await sharedPage.getByText("Edit Markdown").click();
		await expect(sharedPage.getByText("Edit Markdown")).not.toBeVisible();
		await basePage.waitForLoad();

		const monaco = sharedPage.locator("div.view-lines.monaco-mouse-cursor-text").last();
		await monaco.click();
		await monaco.focus();

		await editor.press("End Shift+Home Backspace");
		await editor.forceSave();
		await editor.assertMarkdown("");
	});
});
