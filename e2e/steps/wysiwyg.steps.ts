import { When } from "@cucumber/cucumber";
import { expect } from "playwright/test";
import E2EWorld from "../models/World";
import { sleep } from "./utils/utils";

const MENU_BAR_SELECTOR = `[data-qa="qa-edit-menu-button"]`;

When("заполняем документ", async function (this: E2EWorld, text: string) {
	await this.page().asArticle().setContent(text);
});

When("очищаем документ", async function (this: E2EWorld) {
	await sleep(15);
	await this.page().keyboard().press("Control+A Backspace");
	await this.page().asArticle().forceSave();
	await sleep(15);
	expect(await this.page().asArticle().getContent()).toEqual("");
});

When("вводим {string}", async function (this: E2EWorld, text: string) {
	await sleep(15);
	await this.page().keyboard().type(text);
	await sleep(15);
});

When("нажимаем на клавиши/клавишу {string}", async function (this: E2EWorld, keystroke: string) {
	await sleep(15);
	await this.page().keyboard().press(keystroke);
	await sleep(15);
});

When("наводимся на иконку редактора {string}", async function (this: E2EWorld, name: string) {
	const scope = this.page().inner().locator(MENU_BAR_SELECTOR);
	const icon = this.page().search().icon(name, scope);
	await icon.hover();
});

When("нажимаем на иконку редактора {string}", async function (this: E2EWorld, name: string) {
	await sleep(5);
	const scope = this.page().inner().locator(MENU_BAR_SELECTOR);
	const icon = this.page().search().icon(name, scope);
	await icon.click();
	await sleep(15);
});
