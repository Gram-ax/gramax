import { Given, When } from "@cucumber/cucumber";
import E2EWorld from "../../models/World";
import { replaceMultiple } from "../utils/utils";

const SELECT_SELECTOR = '[role="listbox"]';
const SELECT_OPTIONS_SELECTOR = "[data-radix-collection-item]";

Given("смотрим на список опций", async function (this: E2EWorld) {
	await this.page().search().reset().scope(SELECT_SELECTOR, "find");
});

When("нажимаем на опцию {string}", async function (this: E2EWorld, text: string) {
	const selectContainer = await this.page().search().reset().scope(SELECT_SELECTOR, "find");

	const elem = selectContainer.current().locator(SELECT_OPTIONS_SELECTOR, {
		hasText: replaceMultiple(text, this.replace.bind(this)),
	});

	await elem.click();
	await this.page().waitForLoad();
});

When(
	"нажимаем на элемент {string}, внутри опции {string}",
	async function (this: E2EWorld, elementName: string, optionText: string) {
		const selectContainer = await this.page().search().reset().scope(SELECT_SELECTOR, "find");

		const optionScope = selectContainer.current().locator(SELECT_OPTIONS_SELECTOR, {
			hasText: replaceMultiple(optionText, this.replace.bind(this)),
		});

		const elem = await this.page().search().lookup(elementName, optionScope);

		await elem.hover();
		await elem.focus();
		await elem.press("Enter");
		await this.page().waitForLoad();
	},
);
