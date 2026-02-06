import type GitSourceData from "@gramax/core/extensions/git/core/model/GitSourceData.schema";
import { type BrowserContext, type Page, test } from "@playwright/test";
import BaseSharedPage from "@shared-pom/page";
import "@utils/async";
import { getSourceDataFromEnv } from "@utils/source";
import {
	createFileTree,
	type FileTree,
	readDirToFileTree,
	type SourceData,
	setStorage,
	uploadAndExtractZip,
} from "@web/utils";

export interface WorkerBaseFixture {
	zip: string | undefined;
	experimentalFeatures: string[] | undefined;
	files: FileTree | undefined;
	dir: string | URL | undefined;
	source: "env" | GitSourceData | SourceData | undefined;
	isolated: boolean;
	startUrl: string;
	sharedContext: BrowserContext;
	sharedPage: Page;
	basePage: BaseSharedPage;
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
	startUrl: ["/", { option: true, scope: "worker" }],
	isolated: [true, { option: true, scope: "worker" }],

	sharedContext: [
		async ({ browser }, use) => {
			const context = await browser.newContext();
			await use(context);
			await context.close();
		},
		{ scope: "worker" },
	],

	sharedPage: [
		async ({ sharedContext, isolated, zip, files, dir, source, experimentalFeatures, startUrl }, use) => {
			const page = await sharedContext.newPage();
			await page.goto("/", { waitUntil: "domcontentloaded" });

			if (!isolated) {
				await preparePage({ sharedPage: page, zip, files, dir, source, experimentalFeatures, startUrl });
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
		async ({ sharedPage, isolated, zip, files, dir, source, experimentalFeatures, startUrl }, use) => {
			if (!isolated) {
				await sharedPage.goto(startUrl!, { waitUntil: "domcontentloaded" });
				await use(null);
			}
			await preparePage({ sharedPage, zip, files, dir, source, experimentalFeatures, startUrl });
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
}: Partial<WorkerBaseFixture>) => {
	if (zip) {
		await uploadAndExtractZip(page!, zip);
	}

	if (dir) {
		const tree = await readDirToFileTree(dir);
		await createFileTree(page!, tree);
	}

	if (files) {
		await createFileTree(page!, files);
	}

	if (source) {
		await setStorage(page!, source === "env" ? getSourceDataFromEnv() : source);
	}

	await page!.evaluate((experimentalFeatures) => {
		window.localStorage.setItem("NO_DESKTOP", "1");

		if (experimentalFeatures) window.localStorage.setItem("enabled-features", experimentalFeatures.join(","));
	}, experimentalFeatures);
};
