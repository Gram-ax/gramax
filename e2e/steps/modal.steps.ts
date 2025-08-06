import { Given, Then, When } from "@cucumber/cucumber";
import E2EWorld from "e2e/models/World";
import { expect } from "playwright/test";

const MODAL_SELECTOR = '.outer-modal, .form-layout, [role="dialog"] form';
const MODAL_TITLE_SELECTOR = "legend, h2";

const TAB_SELECTOR_ACTIVE = ".tab-wrapper.show";
const TAB_TITLE_SELECTOR = ".tab-wrapper-title";

Given("смотрим на активную форму", async function (this: E2EWorld) {
	await this.page().search().reset().scope(MODAL_SELECTOR, "find");
});

Given("смотрим на выпадающий список", async function (this: E2EWorld) {
	await this.page().search().reset().scope(`.tippy-content .items:visible`, "find");
});

Given("смотрим на выпадающий список у Dropdown", async function (this: E2EWorld) {
	await this.page().search().reset().scope('[role="menu"]', "find");
});

Given("смотрим на выпадающий список у Select", async function (this: E2EWorld) {
	await this.page().search().reset().scope('[role="listbox"]', "find");
});

When("закрываем активную форму", async function (this: E2EWorld) {
	const elem = await this.page().search().find(".lucide-x", this.page().inner().locator(".x-mark"));
	await elem.click();
});

When("заполняем форму", async function (this: E2EWorld, raw: string) {
	const search = this.page().search();
	for (const [name, val] of raw.split("\n").map((raw) => raw.split(": ", 2).map((s) => s.trim()))) {
		const field = await search.lookup(name, undefined, true);
		await field.fill(this.replace(val) ?? val);
	}
});

Then("видим форму {string}", async function (this: E2EWorld, name: string) {
	const scope = await this.page().search().reset().find(MODAL_SELECTOR);
	const title = await this.page().search().find(MODAL_TITLE_SELECTOR, scope);
	await expect(title).toHaveText(name);
});

Then("видим форму {string} без заголовка", async function (this: E2EWorld, name: string) {
	const scope = await this.page().search().reset().find(MODAL_SELECTOR);
	await this.page().search().lookup(name, scope);
});

Given("смотрим на активную вкладку", async function (this: E2EWorld) {
	await this.page().search().reset().scope(TAB_SELECTOR_ACTIVE, "find");
});

When("закрываем активную вкладку", async function (this: E2EWorld) {
	const elem = await this.page().search().find(".lucide-x", this.page().inner().locator(".x-mark"));
	await elem.click();
});

Then("видим вкладку {string}", async function (this: E2EWorld, name: string) {
	const scope = await this.page().search().reset().find(TAB_SELECTOR_ACTIVE);
	const title = await this.page().search().find(TAB_TITLE_SELECTOR, scope);
	await expect(title).toHaveText(name);
});
