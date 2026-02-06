import type { Locator, Page as PlaywrightPage } from "@playwright/test";
import { expect } from "@playwright/test";

export default class Button {
	constructor(
		private _page: PlaywrightPage,
		private _locator: Locator,
	) {}

	async assertVisible() {
		await expect(this._locator).toBeVisible();
	}

	async assertHasText(text: string | null) {
		if (text === null) {
			await expect(this._locator).not.toHaveText(/.*/);
		} else {
			await expect(this._locator).toHaveText(text);
		}
	}

	async click() {
		await this._locator.click();
	}

	async hover() {
		await this._locator.hover();
	}

	async text(): Promise<string | null> {
		const innerText = await this._locator.innerText();
		return innerText || null;
	}
}
