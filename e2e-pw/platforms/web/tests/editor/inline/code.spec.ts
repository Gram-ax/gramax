import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Code", () => {
	editorTest("create inline code from selection", async ({ editor }) => {
		await editor.setMarkdown("Orange(*)");
		await editor.press("ControlOrMeta+Shift+ArrowLeft");
		await editor.clickToolbar("code");
		await editor.assertMarkdown("`Orange`");
	});

	editorTest("create code block from paragraph", async ({ editor }) => {
		await editor.setMarkdown("Tangerine(*)");
		await editor.clickToolbar("code");
		await editor.assertMarkdown(md`
			\`\`\`
			Tangerine
			\`\`\`
		`);
	});

	editorTest("create code block from multiple paragraphs", async ({ editor }) => {
		await editor.setMarkdown(md`
			Orange

			Tangerine

			Lemon(*)
		`);
		await editor.press("ControlOrMeta+A");
		await editor.clickToolbar("code");
		await editor.assertMarkdown(md`
			\`\`\`
			Orange
			Tangerine
			Lemon
			\`\`\`
		`);
	});

	editorTest("create code block via backtick snippet", async ({ editor }) => {
		await editor.setMarkdown(md`
			Orange

			Tangerine

			(*)
		`);
		await editor.type("```typescript");
		await editor.press("Space");
		await editor.assertMarkdown(md`
			Orange

			Tangerine

			\`\`\`typescript
			\`\`\`
		`);
	});
});
