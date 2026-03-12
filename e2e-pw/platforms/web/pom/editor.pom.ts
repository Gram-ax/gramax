import { expect } from "@playwright/test";
import type BaseSharedPage from "@shared-pom/page";
import { sleep } from "@utils/utils";
import type CatalogPage from "./catalog.page";

type ToolbarButton =
	| "bold"
	| "italic"
	| "strikethrough"
	| "heading-2"
	| "heading-3"
	| "heading-4"
	| "bullet-list"
	| "ordered-list"
	| "task-list"
	| "code"
	| "table"
	| "note"
	| "diagrams"
	| "pencil-ruler";

export type AssertMdOpts = {
	ignoreTabs?: boolean;
};

export type SetMarkdownOpts = {
	skipAssertMarkdownValid?: boolean;
};

const toolbarIconMap: Record<ToolbarButton, string> = {
	bold: '[data-testid="tb-bold"]',
	italic: '[data-testid="tb-italic"]',
	strikethrough: '[data-testid="tb-strikethrough"]',
	"heading-2": '[data-testid="tb-heading-2"]',
	"heading-3": '[data-testid="tb-heading-3"]',
	"heading-4": '[data-testid="tb-heading-4"]',
	"bullet-list": '[data-testid="tb-bullet-list"]',
	"ordered-list": '[data-testid="tb-ordered-list"]',
	"task-list": '[data-testid="tb-task-list"]',
	code: '[data-testid="tb-code"]',
	table: '[data-testid="tb-table"]',
	note: '[data-testid="tb-note"]',
	diagrams: '[data-testid="tb-diagrams"]',
	"pencil-ruler": '[data-testid="tb-pencil-ruler"]',
};

class EditorPom<P extends BaseSharedPage = BaseSharedPage> {
	constructor(
		protected _page: P,
		private _testid: string,
	) {}

	async focus() {
		await this._page.raw.getByTestId(this._testid).focus();
	}
}

export class ArticleEditorPom extends EditorPom<CatalogPage> {
	constructor(page: CatalogPage) {
		super(page, "article-editor");
	}

	bottom() {
		return this._page.raw.getByTestId("article-bottom");
	}

	async markdown(): Promise<string> {
		const content = await this._page.currentArticleContent();
		return content.md;
	}

	async setMarkdown(markdown: string, opts?: SetMarkdownOpts) {
		const hasCursor = markdown.includes("(*)");

		await this._page.raw.evaluate(
			async ({ markdown }) => {
				const app = await window.app!;
				const { catalogName, itemLogicPath } = window.debug.RouterPathProvider.parsePath(
					window.location.pathname,
				);
				const catalog = await app.wm.current().getContextlessCatalog(catalogName!);
				const article = catalog.findArticle(itemLogicPath!.join("/"), []);

				await article.updateContent(markdown.replaceAll("(*)", "[cmd:f]"), true);

				window.refreshPage();
			},
			{ markdown },
		);

		if (hasCursor) {
			const focus = this._page.raw.locator(`.react-renderer.node-inlineMd_component`).last();
			await focus.click({ force: true });
			await focus.press("Delete");
		}

		if (!opts?.skipAssertMarkdownValid) {
			await this.assertMarkdownValid();
		}
	}

	async type(text: string) {
		await sleep(200);
		await this._page.raw.keyboard.type(text, { delay: 100 });
	}

	async press(keys: string) {
		for (const key of keys.split(" ")) {
			await this._page.raw.keyboard.press(key, { delay: 250 });
		}
	}

	async pasteHtml(html: string) {
		await this._page.raw.evaluate(async (h) => {
			const item = new ClipboardItem({
				"text/html": new Blob([h], { type: "text/html" }),
			});
			await navigator.clipboard.write([item]);
		}, html);
		await this.press("ControlOrMeta+V");
	}

	async pasteText(text: string) {
		await this._page.raw.evaluate(async (t) => {
			await navigator.clipboard.writeText(t);
		}, text);
		await this.press("ControlOrMeta+V");
	}

	async forceSave() {
		await this._page.raw.evaluate(async () => {
			await window.debug?.forceSave?.();
		});
	}

	async assertMarkdown(expected: string, opts?: AssertMdOpts) {
		await this.forceSave();

		await this.assertMarkdownValid();

		let clean = expected.replace(/\(\*\)/g, "").trim();
		let cleanedMd = (await this.markdown()).replace(/[ \t]+$/gm, "").trim();
		if (opts?.ignoreTabs) {
			const stripLeadingTabs = (s: string) => s.replace(/^\t+/gm, "");
			clean = stripLeadingTabs(clean);
			cleanedMd = stripLeadingTabs(cleanedMd);
		}
		expect(cleanedMd).toBe(clean);
	}

	async assertMarkdownContains(expected: string | RegExp) {
		await this.forceSave();
		await this.assertMarkdownValid();
		const clean = expected instanceof RegExp ? expected : expected.replace(/\(\*\)/g, "").trim();
		const md = (await this.markdown()).replace(/[ \t]+$/gm, "").trim();
		expected instanceof RegExp ? expect(md).toMatch(clean) : expect(md).toContain(clean);
	}

	async assertMarkdownValid() {
		await expect(this._page.raw.getByText("Gramax couldn’t read the Markdown structure")).not.toBeVisible();
	}

	async clickToolbar(button: ToolbarButton) {
		const selector = toolbarIconMap[button];
		const toolbar = this._page.raw.getByTestId("editor-toolbar");
		await toolbar.locator(selector).click();
	}

	async hoverToolbar(button: ToolbarButton) {
		const selector = toolbarIconMap[button];
		const toolbar = this._page.raw.getByTestId("editor-toolbar");
		await toolbar.locator(selector).hover();
	}
}

export class CommentEditorPom extends EditorPom {
	constructor(page: BaseSharedPage) {
		super(page, "comment-editor");
	}
}
