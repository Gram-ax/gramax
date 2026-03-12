import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("List Tab", () => {
	editorTest("nest list item one level deeper", async ({ editor }) => {
		await editorTest.step("ordered list", async () => {
			await editor.setMarkdown(md`
				1. parsley

				2. cucumber(*)

				   1. orange

				   2. tangerine

				   3. grape
			`);
			await editor.press("Tab");
			await editor.assertMarkdown(md`
				1. parsley

				   1. cucumber

				      1. orange

				      2. tangerine

				      3. grape
			`);
		});

		await editorTest.step("bullet list", async () => {
			await editor.setMarkdown(md`
				-  parsley

				-  green onion(*)

				   -  orange

				   -  tangerine

				   -  grape
			`);
			await editor.press("Tab");
			await editor.assertMarkdown(md`
				-  parsley

				   -  green onion

				      -  orange

				      -  tangerine

				      -  grape
			`);
		});
	});

	editorTest("create bullet list with Tab on empty line", async ({ editor }) => {
		await editor.press("Tab");
		await editor.type("text");
		await editor.assertMarkdown("-  text");
	});

	editorTest("convert paragraph to list item with Tab", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  text

			second(*)
		`);
		await editor.press("Tab");
		await editor.assertMarkdown(md`
			-  text

			-  second
		`);
	});
});
