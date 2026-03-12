import { editorTest } from "@web/fixtures/editor.fixture";

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
});
