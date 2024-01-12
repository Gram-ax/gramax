import { Page } from "playwright";
import { sleep } from "../../steps/utils/utils";
import { ReplaceAlias } from "../World";
import PageContext, { PageInfo } from "./PageContext";

export default class ArticlePageContext extends PageContext {
	constructor(page: Page, alias: ReplaceAlias, _info: PageInfo) {
		super(page, alias, _info);
	}

	async getContent() {
		const path = this.url()
			.split("/")
			.filter((p) => !!p);
		await this.forceSave();
		return await this._page.evaluate(async (path) => {
			const ctx = window.app.contextFactory.fromBrowser("ru" as any, {});
			const presenter = window.app.sitePresenterFactory.fromContext(ctx);
			const data = await presenter.getArticleCatalog(path, []);
			return data.article.content;
		}, path);
	}

	async forceSave() {
		await sleep(150);
		await this._page.evaluate(async () => await window.forceTrollCaller?.());
		return this;
	}

	async setContent(content: string) {
		const path = this.url()
			.split("/")
			.filter((p) => !!p);
		await this._page.press(".ProseMirror", ".");
		await this._page.evaluate(
			async ({ path, content }) => {
				const ctx = window.app.contextFactory.fromBrowser("ru" as any, {});
				const presenter = window.app.sitePresenterFactory.fromContext(ctx);
				const data = await presenter.getArticleCatalog(path, []);
				await data.article.updateContent(content.replace("(*)", "[cmd:focus]"));
				await window.refreshPage();
			},
			{ path, content },
		);

		await this._page.locator('[data-qa="qa-clickable"]', { hasText: "Редактировать Markdown" }).click();
		await this.waitForLoad(this._page.locator(`[data-qa="modal-layout"]`));
		await this._page.locator('[data-qa="qa-clickable"]', { hasText: "Сохранить" }).click();

		if (content.includes("(*)")) {
			const focus = this._page.locator(`.react-renderer.node-inlineMd_component`);
			const target = focus.last();
			await target.focus();
			await target.click({ force: true });
			await target.press("Delete");
		}

		return this;
	}
}
