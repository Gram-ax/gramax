import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Bullet List", () => {
	editorTest("create via hotkey Ctrl+Shift+8", async ({ editor }) => {
		await editor.press("ControlOrMeta+Shift+8");
		await editor.type("text");
		await editor.assertMarkdown("-  text");
	});

	editorTest("create via dash-space", async ({ editor }) => {
		await editor.type("-");
		await editor.press("Space");
		await editor.type("text");
		await editor.assertMarkdown("-  text");
	});

	editorTest("create via toolbar", async ({ editor }) => {
		await editor.clickToolbar("bullet-list");
		await editor.type("text");
		await editor.assertMarkdown("-  text");
	});

	editorTest("add items after empty line", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  text

			(*)
		`);
		await editor.type("-");
		await editor.press("Space");
		await editor.type("text");
		await editor.assertMarkdown(md`
			-  text

			-  text
		`);
	});

	editorTest("convert ordered list to bullet list", async ({ editor }) => {
		await editor.setMarkdown(md`
			1. text

			2. banana(*)

			   1. text
		`);
		await editor.press("ControlOrMeta+Shift+8");
		await editor.assertMarkdown(md`
			-  text

			-  banana

			   1. text
		`);
	});

	editorTest("split bullet list via hotkey", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  text

			-  test(*)

			   -  text
		`);
		await editor.press("ControlOrMeta+Shift+8");
		await editor.assertMarkdown(md`
			-  text

			test

			-  text
		`);
	});

	editorTest("split bullet list via toolbar", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  text

			-  orange(*)

			   -  text
		`);
		await editor.clickToolbar("bullet-list");
		await editor.assertMarkdown(md`
			-  text

			orange

			-  text
		`);
	});

	editorTest("lift nested bullet list via hotkey", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  parsley

			   -  cucumber(*)

			      -  orange

			      -  tangerine

			      -  grape
		`);
		await editor.press("ControlOrMeta+Shift+8");
		await editor.assertMarkdown(md`
			-  parsley

			-  cucumber

			   -  orange

			   -  tangerine

			   -  grape
		`);
	});
});
