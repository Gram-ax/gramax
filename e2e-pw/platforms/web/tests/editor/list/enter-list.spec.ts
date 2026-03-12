import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("List Enter", () => {
	editorTest("create new item with Enter", async ({ editor }) => {
		await editor.clickToolbar("bullet-list");
		await editor.type("Orange");
		await editor.press("Enter");
		await editor.assertMarkdown(md`
			-  Orange

			-${" ".repeat(3)}
		`);
	});

	editorTest("split content on Enter", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  Tangerine

			-  Orange(*)Banana
		`);
		await editor.press("Enter");
		await editor.assertMarkdown(md`
			-  Tangerine

			-  Orange

			-  Banana
		`);
	});

	editorTest("lower nesting level on Enter in empty nested item", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  Tangerine

			   -  Orange

			   -  (*)
		`);
		await editor.press("Enter");
		await editor.assertMarkdown(md`
			-  Tangerine

			   -  Orange

			-${" ".repeat(3)}
		`);
	});

	editorTest("delete item on Enter in empty last item", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  Tangerine

			-  Orange

			-  (*)
		`);
		await editor.press("Enter");
		await editor.assertMarkdown(md`
			-  Tangerine

			-  Orange
		`);
	});
});
