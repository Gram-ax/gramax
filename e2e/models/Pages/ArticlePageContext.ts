import { Aliases } from "e2e/steps/utils/aliases";
import { Page } from "playwright";
import { ReplaceAlias } from "../World";
import PageContext, { PageInfo } from "./PageContext";

export default class ArticlePageContext extends PageContext {
	constructor(page: Page, alias: ReplaceAlias, aliases: Aliases, _info: PageInfo) {
		super(page, alias, aliases, _info);
	}

	async getContent() {
		const path = this._parsePath(this.url());
		await this.forceSave();
		return await this._page.evaluate(async ([path1, path2]) => {
			const ctx = window.app.contextFactory.fromBrowser(
				window.debug?.RouterPathProvider?.parsePath(window.location.pathname)?.language || "ru",
				{},
			);
			const presenter = window.app.sitePresenterFactory.fromContext(ctx);
			return (
				(await presenter.getArticleByPathOfCatalog(path1)).article?.content ??
				(await presenter.getArticleByPathOfCatalog(path2)).article?.content
			);
		}, path);
	}

	async forceSave() {
		await this._page.evaluate(async () => await window.forceTrollCaller?.());
		return this;
	}

	async setContent(content: string) {
		const path = this._parsePath(this.url());
		await this._page.press(".ProseMirror", ".");
		await this._page.evaluate(
			async ({ path, content }) => {
				const ctx = window.app.contextFactory.fromBrowser("ru" as any, {});
				const presenter = window.app.sitePresenterFactory.fromContext(ctx);
				const data =
					(await presenter.getArticleByPathOfCatalog(path[0], [])).article ??
					(await presenter.getArticleByPathOfCatalog(path[1], [])).article;
				await data.updateContent(content.replace("(*)", "[cmd:focus]"));
				await window.refreshPage();
			},
			{ path, content },
		);

		if (content.includes("(*)")) {
			const focus = this._page.locator(`.react-renderer.node-inlineMd_component`);
			const target = focus.last();
			await target.focus();
			await target.click({ force: true });
			await target.press("Delete");
		}

		return this;
	}

	async getProps() {
		const path = this._parsePath(this.url());
		return await this._page.evaluate(
			async ({ path }) => {
				const ctx = window.app.contextFactory.fromBrowser("ru" as any, {});
				const presenter = window.app.sitePresenterFactory.fromContext(ctx);
				const data =
					(await presenter.getArticleByPathOfCatalog(path[0], [])).article ??
					(await presenter.getArticleByPathOfCatalog(path[1], [])).article;
				return data.props;
			},
			{ path },
		);
	}

	private _parsePath(path: string): [string[], string[]] {
		// /gitlab.ics-it.ru/dr/test-catalog/master/-
		///-/-/-/-/test
		const path1 = path
			.split("/")
			.filter((p) => !!p)
			.filter((_, idx) => ![0, 1, 3, 4].includes(idx))
			.map((p) => (p == "-" ? "" : p))
			.filter((p) => !!p);
		const path2 = path.split("/").slice(5);
		return [path1, path2];
	}
}
