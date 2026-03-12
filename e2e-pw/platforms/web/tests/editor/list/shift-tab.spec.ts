import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("List Shift+Tab", () => {
	editorTest("unnest list item", async ({ editor }) => {
		await editorTest.step("ordered list", async () => {
			await editor.setMarkdown(md`
				1. text

				2. text(*)

				   1. text
			`);
			await editor.press("Shift+Tab");
			await editor.assertMarkdown(md`
				1. text

				text

				1. text
			`);
		});

		await editorTest.step("bullet list", async () => {
			await editor.setMarkdown(md`
				-  text

				-  text(*)

				   -  text
			`);
			await editor.press("Shift+Tab");
			await editor.assertMarkdown(md`
				-  text

				text

				-  text
			`);
		});
	});

	editorTest("lift nested list one level", async ({ editor }) => {
		await editorTest.step("bullet list", async () => {
			await editor.setMarkdown(md`
				-  parsley

				   -  green onion(*)

				      -  orange

				      -  tangerine

				      -  grape
			`);
			await editor.press("Shift+Tab");
			await editor.assertMarkdown(md`
				-  parsley

				-  green onion

				   -  orange

				   -  tangerine

				   -  grape
			`);
		});

		await editorTest.step("ordered list", async () => {
			await editor.setMarkdown(md`
				1. parsley

				   1. green onion(*)

				      1. orange

				      2. tangerine

				      3. grape
			`);
			await editor.press("Shift+Tab");
			await editor.assertMarkdown(md`
				1. parsley

				2. green onion

				   1. orange

				   2. tangerine

				   3. grape
			`);
		});
	});
});
