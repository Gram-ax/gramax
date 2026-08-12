import type GitSourceData from "@gramax/core/extensions/git/core/model/GitSourceData.schema";
import { type Page, test, type WebContext } from "@playwright/test";
import BaseSharedPage from "@shared-pom/page";
import "@utils/async";
import { getSourceDataFromEnv } from "@utils/source";
import { type FileTree, readDirToFileTree, type SourceData, setStorage, uploadAndExtractZip } from "@web/utils";

export interface WorkerBaseFixture {
	zip: string | undefined;
	experimentalFeatures: string[] | undefined;
	verboseLogging: boolean | undefined;
	dir: string | URL | undefined;
	source: "env" | GitSourceData | SourceData | undefined;
	isolated: boolean;
	isReadOnly: boolean;
	startUrl: string;
	sharedContext: WebContext;
	sharedPage: Page;
	basePage: BaseSharedPage;
	files: FileTree | undefined;
}

export interface TestBaseFixture {
	reset: null;
}

export const baseTest = test.extend<TestBaseFixture, WorkerBaseFixture>({
	zip: [undefined, { option: true, scope: "worker" }],
	files: [undefined, { option: true, scope: "worker" }],
	dir: [undefined, { option: true, scope: "worker" }],
	source: [undefined, { option: true, scope: "worker" }],
	experimentalFeatures: [undefined, { option: true, scope: "worker" }],
	verboseLogging: [undefined, { option: true, scope: "worker" }],
	startUrl: ["/", { option: true, scope: "worker" }],
	isolated: [true, { option: true, scope: "worker" }],
	isReadOnly: [false, { option: true, scope: "worker" }],

	sharedContext: [
		async ({ browser }, use) => {
			const context = await browser.newContext({
				locale: "en-US",
				acceptDownloads: true,
				permissions: ["clipboard-read", "clipboard-write"],
			});
			await use(context);
			await context.close();
		},
		{ scope: "worker" },
	],

	sharedPage: [
		async (
			{ sharedContext, isolated, zip, files, dir, source, experimentalFeatures, verboseLogging, startUrl },
			use,
		) => {
			const page = await sharedContext.newPage();
			await page.goto("/", { waitUntil: "domcontentloaded" });

			if (!isolated) {
				await preparePage({
					sharedPage: page,
					zip,
					files,
					dir,
					source,
					experimentalFeatures,
					verboseLogging,
					startUrl,
					basePage: new BaseSharedPage(page, startUrl),
				});
				await page.goto(startUrl!, { waitUntil: "domcontentloaded" });
			}

			await use(page);

			await page.close();
		},
		{ scope: "worker" },
	],

	basePage: [
		async ({ sharedPage, startUrl }, use) => {
			await use(new BaseSharedPage(sharedPage, startUrl));
		},
		{ scope: "worker" },
	],

	reset: [
		async (
			{ sharedPage, isolated, zip, files, dir, source, experimentalFeatures, verboseLogging, startUrl },
			use,
		) => {
			if (!isolated) {
				await sharedPage.goto(startUrl!, { waitUntil: "domcontentloaded" });
				await use(null);
				return;
			}
			await preparePage({
				sharedPage,
				zip,
				files,
				dir,
				source,
				experimentalFeatures,
				verboseLogging,
				startUrl,
				basePage: new BaseSharedPage(sharedPage, startUrl),
			});
			await sharedPage.goto(startUrl!, { waitUntil: "domcontentloaded" });
			await use(null);
		},
		{ auto: true },
	],
});

const preparePage = async ({
	sharedPage: page,
	zip,
	files,
	dir,
	source,
	experimentalFeatures,
	verboseLogging,
	isReadOnly,
	basePage,
}: Partial<WorkerBaseFixture>) => {
	if (zip) {
		await uploadAndExtractZip(page!, zip);
	}

	if (dir) {
		const tree = await readDirToFileTree(dir);
		await basePage?.createFileTree(page!, tree);
	}

	if (files) {
		await basePage?.createFileTree(page!, files);
	}

	if (source) {
		await setStorage(page!, source === "env" ? getSourceDataFromEnv() : source);
	}

	await page!.evaluate(
		({ experimentalFeatures, verboseLogging, isReadOnly }) => {
			window.localStorage.setItem("NO_DESKTOP", "1");
			// The browser's print dialog is modal and would hang a run; with this the PDF export stops right
			// before opening it and leaves the paginated pages in the document, which is what a test can read.
			window.localStorage.setItem("NO_PRINT", "1");

			if (experimentalFeatures) window.localStorage.setItem("enabled-features", experimentalFeatures.join(","));
			if (verboseLogging) {
				// Seed the app-settings cache (zustand persist blob) so logging is on at boot (`logging.level` !== "off").
				const key = "app-settings-cache";
				const cache = JSON.parse(window.localStorage.getItem(key) ?? '{"state":{"values":{}},"version":1}');
				cache.state = cache.state ?? {};
				cache.state.values = cache.state.values ?? {};
				cache.state.values.logging = { ...cache.state.values.logging, level: "important" };
				window.localStorage.setItem(key, JSON.stringify(cache));
			}
			if (isReadOnly) window.localStorage.setItem("READ_ONLY", "1");
		},
		{ experimentalFeatures, verboseLogging, isReadOnly },
	);
};
