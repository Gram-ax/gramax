import { When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import E2EWorld from "../../models/World";
import { replaceMultiple } from "../utils/utils";

const CARD_SELECTOR = ".group\\/card";

When("нажимаем на карточку {string}", async function (this: E2EWorld, text: string) {
	const processedText = replaceMultiple(text, this.replace.bind(this));
	const elem = page.locator(`${CARD_SELECTOR}:has-text("${processedText}")`);
	await elem.hover();
	await elem.focus();
	await elem.click();
});

When("смотрим на карточку с текстом {string}", async function (this: E2EWorld, text: string) {
	const processedText = replaceMultiple(text, this.replace.bind(this));
	const elem = page.locator(`${CARD_SELECTOR}:has-text("${processedText}")`);
	await expect(elem).toBeVisible();
	return elem;
});
