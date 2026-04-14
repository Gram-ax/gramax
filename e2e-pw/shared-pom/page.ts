import { expect, type Locator, type Page as PlaywrightPage } from "@playwright/test";
import { sleep } from "@utils/utils";
import { fileURLToPath } from "url";

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

	async waitForLoad(wait: number = 1000, waitAfter: number = 500) {
		try {
			await sleep(wait);
			const loaders = this.page.locator(`[data-qa="loader"], [aria-label='app-loader'], [role="progressbar"]`);

			while ((await loaders.count()) > 0) {
				const all = await loaders.all();
				await all.forEachAsync((l) => l.waitFor({ timeout: 60_000, state: "detached" }));
				await sleep(500);
			}
			await sleep(waitAfter);
		} catch (e) {
			console.error("wait for load: ", e);
		}
	}

	async waitForUrl(url: string) {
		await this.page.waitForURL(this._baseUrl + url);
	}

	async navigate(path: string) {
		await this._page.evaluate((p) => {
			history.pushState({}, "", p);
			dispatchEvent(new PopStateEvent("popstate"));
		}, path);
		await sleep(1500);
	}

	async assertNoModal() {
		await expect(this.modal).not.toBeVisible();
	}

	async copyFileToClipboard(localPath: string | URL) {
		const { readFile } = await import("fs/promises");
		const filePath = localPath instanceof URL ? fileURLToPath(localPath) : localPath;
		const buffer = await readFile(filePath);
		const bytes = [...new Uint8Array(buffer)];
		await this._page.evaluate(async (bytes) => {
			const blob = new Blob([new Uint8Array(bytes)], { type: "image/png" });
			const item = new ClipboardItem({ [blob.type]: blob });
			await navigator.clipboard.write([item]);
		}, bytes);
	}
}
