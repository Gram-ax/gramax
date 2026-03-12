import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Table Copy", () => {
	editorTest("copy table", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(md`
			| 1 (*) | 2 | 3 |
			|---|---|---|
			| 4 | 5 | 6 |
			| 7 | 8 | 9 |
		`);
		await sharedPage.getByTestId("table-select-all").click();
		await editor.press("ControlOrMeta+C Backspace ControlOrMeta+V");
		await editor.assertMarkdownContains("| 1 | 2 | 3 |");
		await editor.assertMarkdownContains("| 4 | 5 | 6 |");
		await editor.assertMarkdownContains("| 7 | 8 | 9 |");
	});
});
