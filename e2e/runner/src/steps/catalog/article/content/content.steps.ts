import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { Core } from "../../../core";
const config = { delay: 20 };

Given("документ содержит", async function (this: Core, doc: string) {
	await this.contentAwaiter.debounce();
	await this.page.catalog.article.content.set(doc);
	await this.contentAwaiter.debounce();
});

When("жмем {string}", async function (this: Core, keyNames: string) {
	for (const keyName of keyNames.split(" ")) await this.page.cucumberPage.keyboard.press(keyName, config);
});

When("вводим {string}", async function (this: Core, text: string) {
	await this.page.cucumberPage.keyboard.type(text, config);
});

Then("документ будет содержать", async function (this: Core, doc: string) {
	await this.page.catalog.article.content.includeFocus(doc);
	await this.contentAwaiter.debounce();
	const equalDoc = await this.page.catalog.article.content.get();
	expect(equalDoc).toBe(doc);
});
