import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("List Delete", () => {
	editorTest("merge after non list item element with list item", async ({ editor }) => {
		await editor.setMarkdown(md`
        -  parsley

        -  orange(*)

        some text
		`);
		await editor.press("Delete");
		await editor.assertMarkdown(md`
        -  parsley

        -  orange

           some text
		`);
	});
});
