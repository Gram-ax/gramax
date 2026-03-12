import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("List Backspace", () => {
	editorTest("merge content into previous item", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  parsley

			   -  green onion

			   -  (*)orange

			   -  tangerine

			   -  grape
		`);
		await editor.press("Backspace");
		await editor.type(" and ");
		await editor.assertMarkdownContains("green onion and orange");
	});

	editorTest("cursor to end of list", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  parsley

			   -  green onion

			   -  orange

			   -  tangerine

			   -  grape

			(*)
		`);
		await editor.press("Backspace");
		await editor.type(" and ");
		await editor.assertMarkdownContains("grape and ");
	});

	editorTest("cursor to end of list with block element", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  parsley

			   -  green onion

			   -  orange

			   -  tangerine

			   -  grape
			${" ".repeat(6)}
			${" ".repeat(6)}[view:::::List]

			(*)
		`);
		await editor.press("Backspace ArrowDown Backspace");
		await editor.assertMarkdown(md`
			-  parsley

			   -  green onion

			   -  orange

			   -  tangerine

			   -  grape
		`);
	});

	editorTest("delete parent list item", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  (*)parsley

			   -  green onion

			   -  orange

			   -  tangerine

			   -  grape
		`);
		await editor.press("Backspace");
		await editor.assertMarkdown(md`
			parsley

			-  green onion

			-  orange

			-  tangerine

			-  grape
		`);
	});
});
