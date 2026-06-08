import { expect, type Locator, type Page as PlaywrightPage } from "@playwright/test";
import { sleep } from "@utils/utils";
import type { FileTree } from "@web/utils";
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

	async createFileTree(page: PlaywrightPage, tree: FileTree, basePath: string = ""): Promise<void> {
		await page.evaluate(
			async ({ tree, basePath }: { tree: FileTree; basePath: string }) => {
				const intoPath = window.debug.intoPath;
				const { wm } = await window.app!;
				const fp = wm.current().getFileProvider();

				const processNode = async (node: FileTree | string | number[], currentPath: string) => {
					if (typeof node === "string") {
						const path = intoPath(currentPath);
						const encoder = new TextEncoder();
						await fp.write(path, encoder.encode(node) as unknown as Buffer);
						return;
					}

					if (Array.isArray(node)) {
						const path = intoPath(currentPath);
						await fp.write(path, new Uint8Array(node) as unknown as Buffer);
						return;
					}

					if (typeof node === "object" && node !== null) {
						const path = intoPath(currentPath);
						await fp.mkdir(path).catch(() => {});

						for (const [name, value] of Object.entries(node)) {
							const nextPath = currentPath ? `${currentPath}/${name}` : name;
							await processNode(value, nextPath);
						}
						return;
					}

					throw new Error(`Invalid node type at path: ${currentPath}`);
				};

				await processNode(tree, basePath);
			},
			{ tree, basePath },
		);
	}

	async assertFileTree(page: PlaywrightPage, tree: FileTree, basePath: string = "") {
		await page.evaluate(
			async ({ tree, basePath }: { tree: FileTree; basePath: string }) => {
				const intoPath = window.debug.intoPath;
				const { wm } = await window.app!;
				const fp = wm.current().getFileProvider();

				const processNode = async (node: FileTree | string | number[], currentPath: string) => {
					if (typeof node === "string") {
						const path = intoPath(currentPath);
						const content = await fp.read(path);
						if (content !== node) throw new Error(`Content of ${path} is not equal to ${node}`);
						return;
					}

					if (typeof node === "object" && node !== null) {
						for (const [name, value] of Object.entries(node)) {
							const nextPath = currentPath ? `${currentPath}/${name}` : name;
							await processNode(value, nextPath);
						}
						return;
					}

					throw new Error(`Invalid node type at path: ${currentPath}`);
				};

				await processNode(tree, basePath);
			},
			{ tree, basePath },
		);
	}
}
