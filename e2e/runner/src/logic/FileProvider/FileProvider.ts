import { Page as CucumberPage } from "@playwright/test";

export default class FileProvider {
	constructor(private _cucumberPage: CucumberPage) {}

	async exists(path: string): Promise<boolean> {
		const temp = true;
		while (temp) {
			const state = await this._evaluateFileProviderMethod("exists", path);
			await new Promise((_resolve) => setTimeout(_resolve, 100));
			if (state) return state;
		}
	}

	async write(path: string, data: string): Promise<void> {
		return await this._evaluateFileProviderMethod("write", path, data);
	}

	async read(path: string): Promise<string> {
		return await this._evaluateFileProviderMethod("read", path);
	}

	private async _evaluateFileProviderMethod(method: keyof FileProvider, path: string, data?: string): Promise<any> {
		return await this._cucumberPage.evaluate(
			async ({ method, path, data }) => {
				const lib = window.app.lib;
				const fp = lib.getFileProvider();
				return await fp[method](window.debug.path(path), data);
			},
			{ method, path, data }
		);
	}
}
