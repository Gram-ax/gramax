import { type BrowserContext, type Page, test } from "@playwright/test";
import "@utils/async";

export interface BaseFixture {
	startUrl: string;
	sharedContext: BrowserContext;
	sharedPage: Page;
}

export const baseTest = test.extend<object, BaseFixture>({
	startUrl: ["/", { option: true, scope: "worker" }],

	sharedContext: [
		async ({ browser }, use) => {
			const context = await browser.newContext();
			await use(context);
			await context.close();
		},
		{ scope: "worker" },
	],

	sharedPage: [
		async ({ sharedContext, startUrl }, use) => {
			const page = await sharedContext.newPage();
			await page.goto(startUrl, { waitUntil: "domcontentloaded" });

			await use(page);

			await page.close();
		},
		{ scope: "worker" },
	],
});
