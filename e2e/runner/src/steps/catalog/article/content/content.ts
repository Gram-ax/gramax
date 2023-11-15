import { Page as CucumberPage } from "@playwright/test";

class Content {
	pattern = "(*)";
	constructor(private _page: CucumberPage) {}

	async focus() {
		const parent = this._page.locator(`[class="react-renderer node-inlineMd_component"]`);
		await parent.waitFor({ state: "visible" });
		await parent.click();
		await parent.press("Delete");
	}

	async includeFocus(doc: string): Promise<void> {
		if (doc.includes(this.pattern)) {
			await this._page.keyboard.type(this.pattern);
			await this._page.evaluate(() => {
				window.documentReady = false;
			});
		}
	}

	async get() {
		const path = await this.getPath();

		const content = await this._page.evaluate(
			async ({ path }) => {
				const sp = window.app.sitePresenterFactory.fromContext(
					window.app.contextFactory.fromBrowser("ru" as any, {})
				);
				const { article } = await sp.getArticleCatalog(path);
				return article.content;
			},
			{ path }
		);

		return content.replace("(\\*)", this.pattern);
	}

	async set(content: string) {
		content = this._replaceFocus(content);
		const path = await this.getPath();
		await this._page.evaluate(
			async ({ path, content }) => {
				const { article } = await window.app.sitePresenterFactory
					.fromContext(window.app.contextFactory.fromBrowser("ru" as any, {}))
					.getArticleCatalog(path);
				await article.updateContent(content);
				window.documentReady = false;
				await window.updateContent();
			},
			{ path, content }
		);
		await this.focus();
	}

	async getPath() {
		const pathname = await this._getLink();
		const { catalogName, articlePath } = this._parsePathname(pathname);

		return [catalogName, articlePath];
	}

	private async _getLink() {
		return this._page.evaluate(() => window.location.pathname);
	}

	private _replaceFocus(content: string) {
		return content.replace(/\(\*\)/g, "[cmd:focus]");
	}

	private _parsePathname(link: string) {
		const arr = link.replace("/", "").split("/");
		const catalogName = arr.shift();
		const articlePath = arr.join("/");

		return { catalogName, articlePath };
	}
}

export default Content;
