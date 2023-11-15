import { AfterStep, Before, BeforeAll, setDefaultTimeout, setWorldConstructor } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page as CucumberPage } from "@playwright/test";
import fs from "fs";
import path from "path";
import { firefox } from "playwright";
import { config } from "./config";
import el from "./logic/utils/el";
import FeatureManager from "./logic/utils/featureManager";
import { Core } from "./steps/core";

const getPage = async (context: BrowserContext, url: string) => {
	const page = await context.newPage();

	await Promise.all([
		page.goto(url),
		page.waitForEvent("response", (response) => response.request().resourceType() === "document")
	]);
	return page;
};

const IS_LOCAL = process.env.IS_LOCAL === "true";
const FAILURES_IMAGES_PATH = path.resolve(__dirname, "failures");
const cleanFailuresImages = () => {
	if (fs.existsSync(FAILURES_IMAGES_PATH))
		fs.readdir(FAILURES_IMAGES_PATH, (error, files) => {
			if (error) throw error;

			for (const file of files) {
				fs.unlink(path.join(FAILURES_IMAGES_PATH, file), (e) => {
					if (e) throw e;
				});
			}
		});
};
setWorldConstructor(Core);
setDefaultTimeout(config.timeout);

BeforeAll({ timeout: config.largeTimeout }, async function () {
	cleanFailuresImages();
	global.browser = await firefox.launch({
		slowMo: config.slowMo,
		devtools: config.devTools,
		headless: process.env.HEADLESS === "false"
	});

	global.context = await global.browser.newContext();

	const url = IS_LOCAL ? config.localUrl : config.serverUrl;
	const page: CucumberPage = await getPage(global.context, url);

	const cookiesValue = config.userCookies.value;
	const cookiesDomain = IS_LOCAL ? config.userCookies.localDomain : config.userCookies.serverDomain;
	await global.context.addCookies([{ name: "user", value: cookiesValue, domain: cookiesDomain, path: "/" }]);

	global.cucumberPage = page;
});

Before(async function (this: Core, scenario) {
	const isNewFeature = FeatureManager.isNewFeature(scenario);
	await global.cucumberPage.waitForLoadState();
	await global.cucumberPage.locator(el("app")).waitFor();
	this.initPage(global.cucumberPage);
	await this.contentAwaiter.init();

	if (isNewFeature) {
		return FeatureManager.setCurrent(scenario);
	}

	if (FeatureManager.isFailed(scenario)) {
		return FeatureManager.getSkippedState();
	}
});

AfterStep(
	{
		timeout: config.largeTimeout
	},
	async function (this: Core, scenario) {
		if (FeatureManager.isStepFailed(scenario)) {
			FeatureManager.addFailed(scenario);
			await this.page.cucumberPage.screenshot({
				path: path.resolve(FAILURES_IMAGES_PATH, `Failure-${FeatureManager.getFailedCount()}.png`)
			});
		}
	}
);

/* eslint-disable no-var */
declare global {
	var m;
	var browser: Browser;
	var context: BrowserContext;
	var cucumberPage: CucumberPage;
}
