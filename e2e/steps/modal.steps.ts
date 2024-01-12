import { Given, Then, When } from "@cucumber/cucumber";
import E2EWorld from "e2e/models/World";
import { expect } from "playwright/test";

const MODAL_SELECTOR = ".outer-modal";
const MODAL_TITLE_SELECTOR = "legend";

Given("смотрим на активную форму", async function (this: E2EWorld) {
	await this.page().search().reset().scope(MODAL_SELECTOR, "find");
});

Given("смотрим на выпадающий список", async function (this: E2EWorld) {
	await this.page().search().reset().scope(".tippy-content .items", "find");
});

When("закрываем активную форму", async function (this: E2EWorld) {
	const elem = await this.page().search().find(".fa-xmark", this.page().inner().locator(".x-mark"));
	await elem.click();
});

Then("заполняем форму", async function (this: E2EWorld, raw: string) {
	const search = this.aliases({
		"%token%": process.env.GX_E2E_GITLAB_TOKEN,
	})
		.page()
		.search();
	for (const [name, val] of raw.split("\n").map((raw) => raw.split(": ", 2).map((s) => s.trim()))) {
		const field = await search.lookup(name, undefined, true);
		await field.fill(this.replace(val) ?? val);
	}
});

Then("видим форму {string}", async function (this: E2EWorld, name: string) {
	const scope = await this.page().search().reset().find(MODAL_SELECTOR);
	const title = await this.page().search().find(MODAL_TITLE_SELECTOR, scope);
	expect(await title.textContent()).toEqual(name);
});

Then("видим форму {string} без заголовка", async function (this: E2EWorld, name: string) {
	const scope = await this.page().search().reset().find(MODAL_SELECTOR);
	await this.page().search().lookup(name, scope);
});
