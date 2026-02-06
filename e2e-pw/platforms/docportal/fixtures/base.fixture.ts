import BasePage from "@docportal/pom/base.page";
import {
	type AuthCredentials,
	createDefaultCredentials,
	loginViaApi,
	type SourceData,
	setStorageViaApi,
} from "@docportal/utils";
import type GitSourceData from "@gramax/core/extensions/git/core/model/GitSourceData.schema";
import { type BrowserContext, type Page, test } from "@playwright/test";
import "@utils/async";
import { getSourceDataFromEnv } from "@utils/source";

export interface WorkerBaseFixture {
	startUrl: string;
	sharedContext: BrowserContext;
	sharedPage: Page;
	basePage: BasePage;
	isolated?: boolean;
	source?: "env" | GitSourceData | SourceData;
	user?: "env" | AuthCredentials;
}

export type TestBaseFixture = {
	reset: null;
};

export const baseTest = test.extend<TestBaseFixture, WorkerBaseFixture>({
	startUrl: ["/", { option: true, scope: "worker" }],
	isolated: [true, { option: true, scope: "worker" }],
	source: [undefined, { option: true, scope: "worker" }],
	user: [undefined, { option: true, scope: "worker" }],

	sharedContext: [
		async ({ browser }, use) => {
			const context = await browser.newContext();
			await use(context);
			await context.close();
		},
		{ scope: "worker" },
	],

	sharedPage: [
		async ({ sharedContext, startUrl, source, user }, use, workerInfo) => {
			const page = await sharedContext.newPage();
			const baseURL = workerInfo.project.use.baseURL || "http://localhost:6003";

			await preparePage({ page, source, user, baseURL });

			await page.goto(startUrl, { waitUntil: "domcontentloaded" });

			await use(page);

			await page.close();
		},
		{ scope: "worker" },
	],

	basePage: [
		async ({ sharedPage, startUrl }, use) => {
			await use(new BasePage(sharedPage, startUrl));
		},
		{ scope: "worker" },
	],

	reset: [
		async ({ sharedPage, basePage, startUrl, isolated }, use) => {
			if (!isolated) {
				await sharedPage.goto(startUrl, { waitUntil: "domcontentloaded" });
				await basePage.waitForLoad();
				await use(null);
				return;
			}

			await basePage.waitForLoad();
			await use(null);
		},
		{ auto: true },
	],
});

interface PreparePageOptions {
	page: Page;
	source?: "env" | GitSourceData | SourceData;
	user?: "env" | AuthCredentials;
	baseURL: string;
}

const preparePage = async ({ page, source, user, baseURL }: PreparePageOptions): Promise<void> => {
	if (user) {
		const credentials = user === "env" ? createDefaultCredentials() : user;
		await loginViaApi(page, credentials, baseURL);
	}

	if (source) {
		const sourceData = source === "env" ? getSourceDataFromEnv() : source;
		await setStorageViaApi(page, sourceData, baseURL);
	}
};
