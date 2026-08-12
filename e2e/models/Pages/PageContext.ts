import type { Locator, Page } from "playwright";
import config from "../../setup/config";
import type { Aliases } from "../../steps/utils/aliases";
import { replaceMultiple, sleep } from "../../steps/utils/utils";
import { KeyboardContext } from "../Contexts/KeyboardContext";
import SearcherContext from "../Contexts/SearcherContext";
import type { ReplaceAlias } from "../World";
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
		await this.inner().evaluate(async () => await window.debug?.clearGxLock());

		const url = config.url + this._alias(path, () => replaceMultiple(path, this._alias.bind(this)));
		if (this.inner().url() === url) return await this.waitForLoad();
		await this.inner().goto(url, { waitUntil: "domcontentloaded" });
		return this;
	}

	url(): string {
		return this._page.url().replace(/^https?:\/\/[a-z0-9:.-]+/, "");
	}

	async waitForLoad() {
		try {
			await sleep(300);
			const loaders = this._page.locator(`[data-qa="loader"], [aria-label='app-loader'], [role="progressbar"]`);

			while ((await loaders.count()) > 0) {
				const all = await loaders.all();
				await Promise.all(all.map((l) => l.waitFor({ timeout: 60_000, state: "detached" })));
				await sleep(500);
			}
		} catch (e) {
			console.error("wait for load: ", e);
		}
	}

	async waitForUrl(url: string) {
		await this.inner().waitForURL(config.url + replaceMultiple(url, this._alias.bind(this)));
	}

	kind(): "home" | "article" {
		return this.url() === "/" ? "home" : "article";
	}

	async resetToArticle() {
		if (this.kind() === "home") {
			await this._page.locator(`text=Добавить каталог`).first().click();
			const menu = await this.search().reset().find('[role="menu"]');
			await menu.locator(`text=Создать новый каталог`).first().click();
		}

		await this._page.locator(".status-bar .lucide-plus").click();
		await this._page.locator(".status-bar .spinner").waitFor({ state: "detached" });
	}

	asArticle() {
		if (this.kind() === "home") throw new Error("Not an article");
		return new ArticlePageContext(this._page, this._alias, this._aliases, this._info);
	}

	// FIX ME IF YOU CAN
	async getCatalogProps() {
		if (this.kind() === "home") throw new Error("Not an catalog");
		return await this._page.evaluate(async () => {
			const app = await window.app;
			const currentCatalog = await app.wm
				.current()
				.getContextlessCatalog(
					window.debug?.RouterPathProvider.parsePath(window.location.pathname).catalogName,
				);
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
