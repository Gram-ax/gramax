import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Marks copy", () => {
	editorTest("marks apply to pasted text between marks", async ({ editor }) => {
		await editor.setMarkdown(md`**bold *text***(*)`);
		await editor.press("ArrowLeft ArrowLeft");
		await editor.pasteText("new text");
		await editor.assertMarkdownContains(md`**bold *tenew textxt***`);
	});
});
