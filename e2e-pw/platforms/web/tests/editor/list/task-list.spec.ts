import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Task List", () => {
	editorTest("create via hotkey Ctrl+Shift+9", async ({ editor }) => {
		await editor.press("ControlOrMeta+Shift+9");
		await editor.type("checkbox");
		await editor.assertMarkdown("* [ ] checkbox");
	});

	editorTest("create via [ ] prefix", async ({ editor }) => {
		await editor.type("[ ]");
		await editor.press("Space");
		await editor.type("checkbox");
		await editor.assertMarkdown(md`
			* [ ]

			checkbox
		`);
	});

	editorTest("create via toolbar", async ({ editor }) => {
		await editor.clickToolbar("task-list");
		await editor.type("checkbox");
		await editor.assertMarkdown("* [ ] checkbox");
	});

	editorTest("add checked item after empty line", async ({ editor }) => {
		await editor.setMarkdown(md`
			* [ ] checkbox

			(*)
		`);
		await editor.type("[x]");
		await editor.press("Space");
		await editor.type("text");
		await editor.assertMarkdown(md`
			* [ ] checkbox

			* [x] text
		`);
	});

	editorTest("lift nested task list via hotkey", async ({ editor }) => {
		await editor.setMarkdown(md`
			* [ ] parsley

			   * [ ] cucumber(*)

			      * [ ] orange

			      * [ ] tangerine

			      * [ ] grape
		`);
		await editor.press("ControlOrMeta+Shift+9");
		await editor.assertMarkdown(md`
			* [ ] parsley

			* [ ] cucumber

			   * [ ] orange

			   * [ ] tangerine

			   * [ ] grape
		`);
	});

	editorTest("convert bullet list to task list via hotkey", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  parsley

			-  (*)
		`);
		await editor.press("ControlOrMeta+Shift+9");
		await editor.assertMarkdown(md`
			* [ ] parsley

			* [ ]${" "}
		`);
	});

	editorTest("convert bullet list to task list via toolbar", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  parsley

			-  (*)
		`);
		await editor.clickToolbar("task-list");
		await editor.assertMarkdown(md`
			* [ ] parsley

			* [ ]${" "}
		`);
	});
});
