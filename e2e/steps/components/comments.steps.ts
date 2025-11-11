import { When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import E2EWorld from "../../models/World";
import { replaceMultiple } from "../utils/utils";

const COMMENT_SELECTOR = '[data-qa="qa-comment"]';

When("нажимаем на текст {string} с комментарием", async function (this: E2EWorld, text: string) {
	const processedText = replaceMultiple(text, this.replace.bind(this));

	const elem = page.locator(`${COMMENT_SELECTOR}:has-text("${processedText}")`);
	await elem.hover();
	await elem.focus();
	await elem.click();
	await this.page().waitForLoad();
});

When("смотрим на окно комментария", async function (this: E2EWorld) {
	await this.page().search().reset().scope(".tippy-content, .tooltip-content", "find");
});

When("находим комментарий с текстом {string}", async function (this: E2EWorld, text: string) {
	const processedText = replaceMultiple(text, this.replace.bind(this));
	const elem = page.locator(`${COMMENT_SELECTOR}:has-text("${processedText}")`).first();
	await expect(elem).toBeVisible();
	return elem;
});
