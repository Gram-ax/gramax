import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "playwright/test";
import E2EWorld from "../models/World";
import config from "../setup/config";
import { makePath, sleep } from "./utils/utils";

Given("находимся в новой статье", { timeout: config.timeouts.long }, async function (this: E2EWorld) {
	await this.page().resetToArticle();
});

Given("находимся в/на {string}", { timeout: config.timeouts.long * 4 }, async function (this: E2EWorld, path: string) {
	await this.page().goto(path);
});

async function lookAt(this: E2EWorld, selector: string, reset?: boolean) {
	if (reset) this.page().search().reset();
	const scope = await this.page().search().scope(selector);
	await scope.focus();
	await this.page().waitForLoad();
}

Given("смотрим на/в {string}", { timeout: config.timeouts.short }, async function (this: E2EWorld, selector: string) {
	await lookAt.bind(this)(selector);
});

Given("смотрим на редактор", { timeout: config.timeouts.short }, async function (this: E2EWorld) {
	await lookAt.bind(this)("редактор");
	this.page().search().reset();
	const editor = await this.page().search().lookup("editor", null, true);
	if ((await editor.count()) > 0) {
		await editor.locator(":nth-child(1)").locator(":nth-child(1)").first().focus();
	} else {
		this.page().search().reset();
		const articleEditor = await this.page().search().lookup("article-editor", null, true);
		if ((await articleEditor.count()) > 0) await articleEditor.press("ArrowDown");
	}
});

Given("смотрим на редактор Monaco", { timeout: config.timeouts.short }, async function (this: E2EWorld) {
	this.page().search().reset();
	const monaco = this.page().inner().locator("div.view-lines.monaco-mouse-cursor-text").last();
	await monaco.click();
	await monaco.focus();
});

Then("видим текст {string} на странице", async function (this: E2EWorld, text: string) {
	expect(await this.page().inner().getByText(text).textContent()).toEqual(text);
});

Given("смотрим на редактор заголовка", { timeout: config.timeouts.short }, async function (this: E2EWorld) {
	await lookAt.bind(this)("редактор");
	await this.page().inner().locator(".ProseMirror :nth-child(1)").first().click({ clickCount: 1, delay: 200 });
});

Then("заново смотрим на/в {string}", async function (this: E2EWorld, selector: string) {
	await lookAt.bind(this)(selector, true);
});

Given("заново смотрим на редактор", { timeout: config.timeouts.short }, async function (this: E2EWorld) {
	await lookAt.bind(this)("редактор", true);
	await this.page().inner().locator(".ProseMirror > h1:first-child + *").first().click({ clickCount: 1, delay: 200 });
});

Given("ждём {float} секунд(ы)(у)", { timeout: 1000000 }, async function (this: E2EWorld, secs: number) {
	await sleep(secs * 1000);
});

When("смотрим на подсказку", async function (this: E2EWorld) {
	await this.page().search().reset().scope(".tippy-content", "find");
});

When("смотрим на вложенную подсказку", async function (this: E2EWorld) {
	await this.page().search().scope(".tippy-content", "find");
});

When("нажимаем на кнопку {string}", { timeout: config.timeouts.medium }, async function (this: E2EWorld, text: string) {
	const elem = this.page().search().clickable(text);
	await elem.click();
	await this.page().waitForLoad();
});

Then("нажимаем на {int} кнопку с текстом {string}", async function (this: E2EWorld, i: number, text: string) {
	await this.page().search().clickable(text, undefined, true).nth(i).click();
});

When("нажимаем на поле {string}", { timeout: config.timeouts.medium }, async function (this: E2EWorld, text: string) {
	const elem = await this.page().search().lookup(text, undefined, true);
	await elem.click();
	await this.page().waitForLoad();
});

When(
	"нажимаем на элемент {string}",
	{ timeout: config.timeouts.medium },
	async function (this: E2EWorld, text: string) {
		const elem = await this.page().search().lookup(text, undefined);
		await elem.click();
		await this.page().waitForLoad();
	},
);

When(
	"наводимся и нажимаем на элемент {string}",
	{ timeout: config.timeouts.medium },
	async function (this: E2EWorld, text: string) {
		const elem = await this.page().search().lookup(text, undefined);
		await elem.hover({ force: true });
		await elem.click();
		await this.page().waitForLoad();
	},
);

When(
	"нажимаем на кнопку {string} и ждём загрузки",
	{ timeout: config.timeouts.long * 4 },
	async function (this: E2EWorld, text: string) {
		const elem = this.page().search().clickable(text);
		await elem.click();
		this.page().search().reset();
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
	await this.page().waitForUrl(path);
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
	await sleep(10);
	if (text.includes("(*)")) await this.page().keyboard().type("(*)");
	const content = (await this.page().asArticle().getContent())?.replace("(\\*)", "(*)");
	expect(content).toEqual(text);
});

Then("разметка текущей статьи ничего не содержит", async function (this: E2EWorld) {
	expect((await this.page().asArticle().getContent()).trim()).toEqual("");
});

Then("свойства текущей статьи содержат", async function (this: E2EWorld, raw: string) {
	const props = await this.page().asArticle().getProps();
	for (const [name, val] of raw.split("\n").map((raw) => raw.split(": ", 2).map((s) => s.trim()))) {
		expect(props[name]?.toString()).toEqual(val);
	}
});

Then("перезагружаем страницу", async function (this: E2EWorld) {
	await this.page().inner().reload();
});

Then(
	/^файл "([^"]*)" (не )?содержит "([^"]*)"$/,
	async function (this: E2EWorld, p: string, content: string, negative: boolean) {
		const fp = await this.fp();
		const path = makePath(p);
		expect(await fp.handle.exists(path)).toBeTruthy();
		let assert = expect(await fp.handle.read(path));
		assert = negative ? assert : assert.not;
		assert.toEqual(content.trim());
	},
);

Then(/^(не )?видим текст "([^"]*)"$/, async function (this: E2EWorld, negative: boolean, text: string) {
	const elem = await this.page().search().find(`text=${text}`);
	negative ? await expect(elem).not.toBeVisible() : await expect(elem).toBeVisible();
});

Then(/^(не )?видим кнопку "([^"]*)"$/, async function (this: E2EWorld, negative: boolean, name: string) {
	const elem = this.page().search().clickable(name);
	negative ? await expect(elem).not.toBeVisible() : await expect(elem).toBeVisible();
});

Then(/^(не )?видим иконку "([^"]*)"$/, async function (this: E2EWorld, negative: boolean, name: string) {
	const elem = this.page().search().icon(name);
	negative ? await expect(elem).not.toBeVisible() : await expect(elem).toBeVisible();
});

Then(/^((не )?ожидаем ошибку)$/, function (this: E2EWorld, negative: boolean) {
	this.allowErrorModal = !negative;
});
