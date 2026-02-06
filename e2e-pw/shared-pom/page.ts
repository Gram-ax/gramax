import { expect, type Locator, type Page as PlaywrightPage } from "@playwright/test";
import { sleep } from "@utils/utils";

export type { PlaywrightPage };

export default class BaseSharedPage {
	constructor(
		protected _page: PlaywrightPage,
		private _baseUrl: string,
	) {}

	get raw() {
		return this._page;
	}

	assertUrl(url: string) {
		expect(this._page.url().replace(/^https?:\/\/[a-z0-9:.-]+/, "")).toStrictEqual(url);
	}

	get modal(): Locator {
		return this._page.getByTestId("modal");
	}

	get page() {
		return this._page;
	}

	get url(): string {
		return this._page.url().replace(/^https?:\/\/[a-z0-9:.-]+/, "");
	}

	async goto(path: string) {
		await this.page.evaluate(async () => await window.debug?.clearGxLock());
		const url = this._baseUrl + path;
		if (this.page.url() === url) return await this.waitForLoad();
		await this.page.goto(url, { waitUntil: "domcontentloaded" });
		return this;
	}

	async waitForLoad() {
		try {
			await sleep(500);
			const loaders = await this.page
				.locator(`[data-qa="loader"], [aria-label='app-loader'], [role="progressbar"]`)
				.all();
			await Promise.all(loaders.map((l) => l.waitFor({ timeout: 30_000, state: "detached" })));
		} catch (e) {
			console.error("wait for load: ", e);
		}
	}

	async waitForUrl(url: string) {
		await this.page.waitForURL(this._baseUrl + url);
	}

	async assertNoModal() {
		await expect(this.modal).not.toBeVisible();
	}
}
