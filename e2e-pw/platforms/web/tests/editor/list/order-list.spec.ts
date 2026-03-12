import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Ordered List", () => {
	editorTest("create via hotkey Ctrl+Shift+7", async ({ editor }) => {
		await editor.press("ControlOrMeta+Shift+7");
		await editor.type("test");
		await editor.assertMarkdown("1. test");
	});

	editorTest("create via 1. prefix", async ({ editor }) => {
		await editor.type("1.");
		await editor.press("Space");
		await editor.type("text");
		await editor.assertMarkdown("1. text");
	});

	editorTest("create via toolbar", async ({ editor }) => {
		await editor.clickToolbar("ordered-list");
		await editor.type("text");
		await editor.assertMarkdown("1. text");
	});

	editorTest("add items after empty line", async ({ editor }) => {
		await editor.setMarkdown(md`
			1. text

			(*)
		`);
		await editor.type("2.");
		await editor.press("Space");
		await editor.type("text");
		await editor.assertMarkdown(md`
			1. text

			2. text
		`);
	});

	editorTest("convert bullet list to ordered list", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  text

			-  text(*)

			    -  text
		`);
		await editor.press("ControlOrMeta+Shift+7");
		await editor.assertMarkdown(md`
			1. text

			2. text

			   -  text
		`);
	});

	editorTest("split ordered list via hotkey", async ({ editor }) => {
		await editor.setMarkdown(md`
			1. apple

			2. test(*)

			   1. text
		`);
		await editor.press("ControlOrMeta+Shift+7");
		await editor.assertMarkdown(md`
			1. apple

			test

			1. text
		`);
	});

	editorTest("split ordered list via toolbar", async ({ editor }) => {
		await editor.setMarkdown(md`
			1. text

			2. orange(*)

			   1. text
		`);
		await editor.clickToolbar("ordered-list");
		await editor.assertMarkdown(md`
			1. text

			orange

			1. text
		`);
	});

	editorTest("lift nested ordered list via hotkey", async ({ editor }) => {
		await editor.setMarkdown(md`
			1. parsley

			   1. cucumber(*)

			      1. orange

			      2. tangerine

			      3. grape
		`);
		await editor.press("ControlOrMeta+Shift+7");
		await editor.assertMarkdown(md`
			1. parsley

			2. cucumber

			   1. orange

			   2. tangerine

			   3. grape
		`);
	});
});
