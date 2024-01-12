import { Then } from "@cucumber/cucumber";
import E2EWorld from "e2e/models/World";
import { expect } from "playwright/test";

Then("видим блок комментариев", async function (this: E2EWorld) {
	const elem = await this.page().search().find(".comment-block", this.page().inner().locator(".article-body"));
	expect(await elem.isVisible()).toBeTruthy();
});

Then("видим комментарий {string}", async function (this: E2EWorld, text: string) {
	const elem = await this.page().search().lookup(text);
	expect(await elem.isVisible()).toBeTruthy();
});
