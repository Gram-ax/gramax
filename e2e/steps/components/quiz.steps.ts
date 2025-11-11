import { When } from "@cucumber/cucumber";
import E2EWorld from "../../models/World";
import { expect } from "playwright/test";
import { replaceMultiple, sleep } from "../utils/utils";

const QUESTION_SELECTOR = "div.question";
const ANSWER_SELECTOR = "div.answer";

When("смотрим на вопрос под номером {int}", async function (this: E2EWorld, number: number) {
	await this.page().search().reset().scope(QUESTION_SELECTOR, "find", number);
});

When("смотрим на вопрос с текстом {string}", async function (this: E2EWorld, text: string) {
	const processedText = text.startsWith("%") ? replaceMultiple(text, this.replace.bind(this)) : text;
	await this.page().search().reset().scope(`${QUESTION_SELECTOR}:has-text("${processedText}")`, "find");
});

When("смотрим на ответ с текстом {string}", async function (this: E2EWorld, text: string) {
	const processedText = text.startsWith("%") ? replaceMultiple(text, this.replace.bind(this)) : text;
	await this.page().search().scope(`${ANSWER_SELECTOR}:has-text("${processedText}")`, "find");
});

When(
	"нажимаем на элемент {string}, внутри ответа {string}",
	async function (this: E2EWorld, elementName: string, answerText: string) {
		const selectContainer = await this.page().search().reset().scope(QUESTION_SELECTOR, "find");

		const questionScope = selectContainer.current().locator(QUESTION_SELECTOR, {
			hasText: answerText.startsWith("%") ? replaceMultiple(answerText, this.replace.bind(this)) : answerText,
		});

		const elem = await this.page().search().lookup(elementName, questionScope);

		await elem.hover();
		await elem.focus();
		await elem.click();
	},
);

When("переключаем инпут на ответе с текстом {string}", async function (this: E2EWorld, text: string) {
	const processedText = text.startsWith("%") ? replaceMultiple(text, this.replace.bind(this)) : text;
	const answerScope = await this.page()
		.search()
		.reset()
		.scope(`${ANSWER_SELECTOR}:has-text("${processedText}")`, "find");

	const elem = (await answerScope.scope("[role='checkbox'], [role='radio']", "find")).current();
	await elem.hover();
	await elem.focus();
	await elem.click();
});

When("ставим курсор в ответ под номером {int}", async function (this: E2EWorld, number: number) {
	const answerScope = await this.page().search().scope(ANSWER_SELECTOR, "find", number);
	const paragraph = answerScope.current().locator("p");
	await sleep(150);
	await paragraph.focus();
	await paragraph.click();
	await sleep(150);
});

When(
	"вопрос под номером {int} содержит {int} ответов/ответа/ответов",
	async function (this: E2EWorld, number: number, count: number) {
		const questionScope = await this.page().search().reset().scope(QUESTION_SELECTOR, "find", number);
		const answers = await questionScope.current().locator(ANSWER_SELECTOR).count();

		expect(answers).toEqual(count);
	},
);

When("отмеченных ответов равно {int}", async function (this: E2EWorld, count: number) {
	const answers = await this.page().search().current().locator("[data-selected='true']").count();
	expect(answers).toEqual(count);
});

When(/вопрос (не )?содержит радиокнопок$/, async function (this: E2EWorld, negative: boolean) {
	const answers = (await this.page().search().current().locator("[role='radio']").count()) > 0;
	negative ? expect(answers).toBeFalsy() : expect(answers).toBeTruthy();
});

When(/вопрос (не )?является обязательным$/, async function (this: E2EWorld, negative: boolean) {
	const required = (await this.page().search().current().locator("[data-required='true']").count()) === 1;
	negative ? expect(required).toBeFalsy() : expect(required).toBeTruthy();
});
