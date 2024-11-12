import { Aliases } from "e2e/steps/utils/aliases";
import { Locator, Page } from "playwright";
import config from "../../setup/config";
import { replaceMultiple } from "../../steps/utils/utils";
import { KeyboardContext } from "../Contexts/KeyboardContext";
import SearcherContext from "../Contexts/SearcherContext";
import { ReplaceAlias } from "../World";
import ArticlePageContext from "./ArticlePageContext";

export class PageInfo {
	scope: Locator;
}

export default class PageContext {
	constructor(
		protected _page: Page,
		protected _alias: ReplaceAlias,
		protected _aliases: Aliases,
		protected _info = new PageInfo(),
	) {}

	inner() {
		return this._page;
	}

	async goto(path: string) {
		const url = config.url + this._alias(path, () => replaceMultiple(path, this._alias.bind(this)));
		if (this.inner().url() == url) return await this.waitForLoad();
		await this.inner().goto(url, { waitUntil: "domcontentloaded" });

		return this;
	}

	url(): string {
		return this._page.url().replace(/^https?:\/\/[a-z0-9:.-]+/, "");
	}

	async waitForLoad(scope?: Locator) {
		const loaders = await this.search().find(`[data-qa="loader"]`, scope);
		for (const loader of await loaders.all())
			await loader.waitFor({ timeout: config.timeouts.long * 4, state: "detached" });
	}

	async waitForUrl(url: string) {
		await this.inner().waitForURL(config.url + replaceMultiple(url, this._alias.bind(this)));
	}

	kind(): "home" | "article" {
		return this.url() == "/" ? "home" : "article";
	}

	async resetToArticle() {
		if (this.kind() == "home") {
			await this._page.locator(`text=Добавить каталог`).first().click();
			await this._page.locator(`text=Создать новый`).first().click();
		}

		await this._page.locator(".status-bar .lucide-plus").click();
		await this._page.locator(".status-bar .spinner").waitFor({ state: "detached" });
	}

	asArticle() {
		if (this.kind() == "home") throw new Error("Not an article");
		return new ArticlePageContext(this._page, this._alias, this._aliases, this._info);
	}

	// FIX ME IF YOU CAN 
	async getCatalogProps() {
		if (this.kind() == "home") throw new Error("Not an catalog");
		return await this._page.evaluate(async () => {
			const currentCatalog = await window.app.wm
				.current()
				.getCatalog(window.debug?.RouterPathProvider.parsePath(window.location.pathname).catalogName);
			return currentCatalog.props;
		});
	}

	search() {
		return new SearcherContext(this._alias, this._aliases, this._info);
	}

	keyboard() {
		return new KeyboardContext(this._info.scope ?? this._page.locator("body"));
	}
}
