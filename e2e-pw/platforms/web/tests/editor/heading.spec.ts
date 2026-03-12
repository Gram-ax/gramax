import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Headings", () => {
	editorTest("turn paragraph into heading via hotkey", async ({ editor }) => {
		await editor.setMarkdown(md`
			text(*)

			text
		`);
		await editor.press("ControlOrMeta+Alt+2");
		await editor.assertMarkdown(md`
			## text

			text
		`);
	});

	editorTest("press Enter inside heading", async ({ editor }) => {
		await editor.setMarkdown("## te(*)xt");
		await editor.press("Enter");
		await editor.assertMarkdown(md`
			## te

			xt
		`);
	});

	editorTest("press Enter at start of heading", async ({ editor }) => {
		await editor.setMarkdown("## (*)text");
		await editor.press("Enter");
		await editor.assertMarkdown(md`


			## text
		`);
	});

	editorTest("heading in list stays escaped", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  first

			   -  second

			      \\##(*)
		`);
		await editor.press("Space");
		await editor.type("after");
		await editor.assertMarkdown(md`
			-  first

			   -  second

			      \\## after
		`);
	});

	editorTest("delete heading and merge with previous element", async ({ editor }) => {
		await editor.setMarkdown(md`
			another text

			## text(*)
		`);
		await editor.press("ControlOrMeta+Shift+ArrowLeft Backspace Backspace");
		await editor.type("after");
		await editor.assertMarkdown("another textafter");
	});

	editorTest("backspace at start second child of article merge content to title", async ({ editor }) => {
		await editor.setMarkdown(md`
			(*)123
		`);
		await editor.press("Backspace ControlOrMeta+ArrowRight Enter");
		await editor.setMarkdown(md`
			(*)123
		`);
		await editor.press("Backspace ArrowRight Enter");
		await editor.assertMarkdown("23");
	});

	editorTest("backspace at start second child set focus to title", async ({ editor }) => {
		await editor.setMarkdown(md`
			(*)123
		`);
		await editor.press("Backspace ControlOrMeta+ArrowRight Enter");
		await editor.setMarkdown(md`
			(*)
		`);
		await editor.press("Backspace");
		await editor.type("23");
		await editor.press("ArrowLeft ArrowLeft Enter");
		await editor.assertMarkdown("23");
	});
});
