import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "playwright/test";
import E2EWorld from "../models/World";
import config from "../setup/config";
import { makePath, sleep } from "./utils/utils";

Given("находимся в новой статье", { timeout: config.timeouts.long }, async function (this: E2EWorld) {
	await this.page().resetToArticle();
});

Given("находимся в/на {string}", { timeout: config.timeouts.long }, async function (this: E2EWorld, path: string) {
	await this.page().goto(path);
});

Given("смотрим на/в {string}", { timeout: config.timeouts.short }, async function (this: E2EWorld, selector: string) {
	const scope = await this.page().search().scope(selector);
	await scope.focus();
	await this.page().waitForLoad();
});

Given("ждём {float} секунд(ы)(у)", { timeout: 1000000 }, async function (this: E2EWorld, secs: number) {
	await sleep(secs * 1000);
});

When("смотрим на подсказку", async function (this: E2EWorld) {
	await this.page().search().reset().scope(".tippy-content", "find");
});

When("нажимаем на кнопку {string}", { timeout: config.timeouts.medium }, async function (this: E2EWorld, text: string) {
	const elem = this.page().search().clickable(text);
	await elem.click();
	await this.page().waitForLoad();
});

Then("нажимаем на {int} кнопку с текстом {string}", async function (this: E2EWorld, i: number, text: string) {
	await this.page().search().clickable(text, undefined, true).nth(i).click();
});

When("нажимаем на {string}", { timeout: config.timeouts.medium }, async function (this: E2EWorld, text: string) {
	const elem = await this.page().search().lookup(text);
	await elem.click();
	await this.page().waitForLoad();
});

When(
	"нажимаем на кнопку {string} и ждём загрузки",
	{ timeout: config.timeouts.long * 4 },
	async function (this: E2EWorld, text: string) {
		const elem = this.page().search().clickable(text);
		await elem.click();
		await this.page().waitForLoad();
	},
);

When(
	"нажимаем на кнопку {string}, смотря на/в {string}",
	{ timeout: config.timeouts.medium },
	async function (this: E2EWorld, name: string, where: string) {
		const scope = await this.page().search().lookup(where);
		const elem = this.page().search().clickable(name, scope);
		await elem.click();
		await this.page().waitForLoad(scope);
	},
);

When("нажимаем на иконку {string}", async function (this: E2EWorld, name: string) {
	const elem = this.page().search().icon(name);
	await elem.click();
	await this.page().waitForLoad();
});

When("нажимаем на иконку {string}, смотря на/в {string}", async function (this: E2EWorld, name: string, where: string) {
	const scope = await this.page().search().lookup(where);
	const elem = this.page().search().icon(name, scope);
	await elem.click();
	await this.page().waitForLoad(scope);
});

When("наводим мышку", async function (this: E2EWorld) {
	await this.page().search().hover();
});

When("ждём конца загрузки", { timeout: config.timeouts.long * 4 }, async function (this: E2EWorld) {
	const loader = await this.page().search().find(`[data-qa="loader"]`);
	await loader.waitFor({ timeout: config.timeouts.long * 4, state: "detached" });
});

Then("находимся по адресу {string}", async function (this: E2EWorld, path: string) {
	await this.page()
		.inner()
		.waitForURL(config.url + path);
});

Then("находимся на главной", function (this: E2EWorld) {
	expect(this.page().url()).toEqual("/");
});

Then("находимся в статье", function (this: E2EWorld) {
	expect(this.page().url()).not.toEqual("/");
});

Then("папка/файл/путь {string} существует", async function (this: E2EWorld, p: string) {
	const fp = await this.fp();
	expect(await fp.handle.exists(makePath(p))).toBeTruthy();
});

Then("папка/файл/путь {string} не существует", async function (this: E2EWorld, p: string) {
	const fp = await this.fp();
	expect(await fp.handle.exists(makePath(p))).toBeFalsy();
});

Then("разметка текущей статьи содержит", async function (this: E2EWorld, text: string) {
	await sleep(100);
	if (text.includes("(*)")) await this.page().keyboard().type("(*)");
	const content = (await this.page().asArticle().getContent()).replace("(\\*)", "(*)");
	expect(content).toEqual(text);
});

Then("разметка текущей статьи ничего не содержит", async function (this: E2EWorld) {
	expect((await this.page().asArticle().getContent()).trim()).toEqual("");
});

Then("файл {string} содержит", async function (this: E2EWorld, p: string, content: string) {
	const fp = await this.fp();
	const path = makePath(p);
	expect(await fp.handle.exists(path)).toBeTruthy();
	expect(await fp.handle.read(path)).toEqual(content.trim());
});

Then("видим элемент {string}", async function (this: E2EWorld, name: string) {
	const elem = await this.page().search().lookup(name);
	expect(await elem.isVisible()).toBeTruthy();
});

Then("видим кнопку {string}", async function (this: E2EWorld, name: string) {
	const elem = this.page().search().clickable(name);
	expect(await elem.isVisible()).toBeTruthy();
});

Then("не видим кнопку {string}", async function (this: E2EWorld, name: string) {
	const elem = this.page().search().clickable(name);
	expect(!(await elem.isVisible())).toBeTruthy();
});

Then("видим иконку {string}", async function (this: E2EWorld, name: string) {
	const elem = this.page().search().icon(name);
	expect(await elem.isVisible()).toBeTruthy();
});
