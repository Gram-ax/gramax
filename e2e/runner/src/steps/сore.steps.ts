import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { config } from "../config";
import { getAlternativeButton } from "../logic/utils/buttons";
import el from "../logic/utils/el";
import getPathList from "../logic/utils/pathList";
import { Core } from "./core";

Given("находимся в {string}", async function (this: Core, path: string) {
	const { query, isFirst } = this.page.parseUrl(config.localUrl);
	const pathList = getPathList(path);

	if (!isFirst) {
		await this.page.homeBtn.click();
		return await this.page.catalogs.filter({ hasText: pathList.next() }).click();
	}
	await this.page.cucumberPage.goto(config.localUrl + query);
	await this.page.cucumberPage.waitForURL(config.localUrl + query);
});

Given("на главной странице", { timeout: config.mediumTimeout }, async function (this: Core) {
	const url = this.page.cucumberPage.url();
	if (url !== config.localUrl) await this.page.cucumberPage.goto(config.localUrl);
});

When("ждем {int} мс", { timeout: config.largeTimeout }, async function (this: Core, seconds: number) {
	await this.page.cucumberPage.waitForTimeout(seconds);
});

When("нажимаем на {string}", { timeout: config.mediumTimeout }, async function (this: Core, expectString) {
	const button = getAlternativeButton(expectString);
	if (button) {
		await this.page.cucumberPage.locator(el(button)).click();
		return await new Promise((_resolve) => setTimeout(_resolve, 150));
	}
	const secondButton = this.page.cucumberPage
		.locator(el("button-element"))
		.filter({ hasText: new RegExp(`^${expectString}$`) });

	if (await secondButton.isVisible()) return secondButton.click();

	await this.page.cucumberPage.locator(el("app-action")).filter({ hasText: expectString }).click();
});

When("выбираем {string}", { timeout: config.mediumTimeout }, async function (this: Core, expectString) {
	await this.page.cucumberPage.locator(el("list-item")).filter({ hasText: expectString }).click();
});

When("вставляем в поле {string} {string}", async function (this: Core, expectedLocator, expectedData) {
	await this.page.cucumberPage
		.locator(el(expectedLocator))
		.fill(expectedData == "GITLAB_TOKEN" ? process.env.GITLAB_TOKEN : expectedData);
});

When("ждем загрузки", { timeout: config.mediumTimeout }, async function (this: Core) {
	await this.page.cucumberPage.locator(el("loader")).waitFor({ state: "detached" });
});

Then("файл {string} существует", async function (this: Core, expectString) {
	const state = await this.fp.exists(expectString);
	expect(state).toBe(true);
});
