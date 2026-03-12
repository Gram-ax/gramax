import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Code Block", () => {
	editorTest("copy from code block", async ({ editor }) => {
		await editor.setMarkdown(md`
			\`\`\`


			testo
			testo
			\`\`\`

			(*)
		`);
		await editor.press(
			"Backspace ControlOrMeta+Shift+ArrowLeft Shift+ArrowUp ControlOrMeta+C Backspace Enter Backspace",
		);
		await editor.press("ControlOrMeta+V");
		await editor.assertMarkdownContains(md`
			testo

			testo
		`);
	});

	editorTest("shift+enter inserts newline instead of splitting code block", async ({ editor }) => {
		await editor.clickToolbar("code");
		await editor.type("line1");
		await editor.press("Shift+Enter");
		await editor.type("line2");
		await editor.assertMarkdown(md`
			\`\`\`
			line1
			line2
			\`\`\`
		`);
	});

	editorTest("tab in code block", async ({ editor }) => {
		await editor.clickToolbar("code");
		await editor.press("Tab");
		await editor.type("testo");
		await editor.assertMarkdown(md`
			\`\`\`
			${"\t"}testo
			\`\`\`
		`);
	});
});
