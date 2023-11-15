import { Page as CucumberPage } from "playwright-core";

export default class ContentAwaiter {
	constructor(private _cucumberPage: CucumberPage) {}

	async init(): Promise<void> {
		await this._cucumberPage.evaluate(() => {
			const originalFunction = window.commands.article.updateContent.do.bind(
				window.commands.article.updateContent
			);
			window.commands.article.updateContent.do = async (...args) => {
				const result = await originalFunction(...args);
				window.documentReady = true;
				return result;
			};
		});
	}

	async debounce(): Promise<boolean> {
		let attempt = 25;
		while (attempt > 0) {
			attempt--;
			await new Promise((res) => setTimeout(res, 100));
			const state = await this._cucumberPage.evaluate(() => window.documentReady);
			if (state) return state;
		}
	}
}
