import { Given, When } from "@cucumber/cucumber";
import E2EWorld from "../../models/World";
import { replaceMultiple } from "../utils/utils";

const SELECT_SELECTOR = '[role="dialog"] > [cmdk-root]';
const SELECT_OPTIONS_SELECTOR = "[role='option']";

Given("смотрим на список опций асинхронного выбора", async function (this: E2EWorld) {
	await this.page().search().reset().scope(SELECT_SELECTOR, "find");
});

When("нажимаем на опцию асинхронного выбора {string}", async function (this: E2EWorld, text: string) {
	const selectContainer = await this.page().search().reset().scope(SELECT_SELECTOR, "find");

	const optionScope = selectContainer.current().locator(SELECT_OPTIONS_SELECTOR, {
		hasText: replaceMultiple(text, this.replace.bind(this)),
	});

	await optionScope.click();
	await this.page().waitForLoad();
});

When("пишем в поиск асинхронного выбора {string}", async function (this: E2EWorld, text: string) {
	const selectContainer = await this.page().search().reset().scope(SELECT_SELECTOR, "find");
	const inputField = selectContainer.current().locator("input");

	await inputField.focus();
	await inputField.fill(replaceMultiple(text, this.replace.bind(this)));
	await this.page().waitForLoad();
});
