import { md } from "@utils/utils";
import { ArticleEditorPom } from "@web/pom/editor.pom";
import { catalogTest } from "./catalog.fixture";

export type EditorFixture = {
	initMd?: string;
	editor: ArticleEditorPom;
	firstEnter?: boolean;
};

export const editorTest = catalogTest.extend<EditorFixture>({
	initMd: [undefined, { option: true }],
	firstEnter: [true, { option: true }],
	files: {
		editor: {
			"new-article.md": "",
			"doc-root.yml": md`
				syntax: xml
			`,
		},
	},
	startUrl: "/-/-/-/-/editor/new-article",

	editor: async ({ catalogPage, initMd, firstEnter }, use) => {
		const editor = new ArticleEditorPom(catalogPage);

		await editor.setMarkdown(typeof initMd === "string" ? initMd : "");
		await editor.focus();
		if (firstEnter) await editor.press("Enter");
		await use(editor);
	},
});
