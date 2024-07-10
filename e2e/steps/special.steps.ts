import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "playwright/test";
import E2EWorld from "../models/World";
import config from "../setup/config";
import { checkForErrorModal,sleep } from "./utils/utils";

Given("отменяем все изменения", { timeout: config.timeouts.long }, async function (this: E2EWorld) {
	const search = this.page().search().reset();
	await search.scope("левую панель");
	await search.scope("нижнюю панель");
	await search.icon("облачка").click();

	await search.reset().find(".form-layout");
	await this.page().waitForLoad();

	const close = search.clickable("Понятно");

	if (await close.isVisible()) {
		await search.clickable("Понятно").click();
	} else {
		await search.scope("публикация");
		await search.scope("левую панель");
		await search.scope("Выбрать все");
		await search.icon("отмена").click();
	}

	search.reset();
	await this.page().waitForLoad();
});

Then("решаем конфликт", { timeout: config.timeouts.long }, async function (this: E2EWorld) {
	await sleep(1000);
	await this.page().keyboard().press("Control+A");
	await this.page().keyboard().type(`---\norder: 1\ntitle: Тест\n---\n\nM\n`);
});

When("вставляем тестовую картинку", async function (this: E2EWorld) {
	await this.page()
		.inner()
		.evaluate(async () => {
			const base64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==`;

			const response = await fetch(base64);
			const blob = await response.blob();
			await window.navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
		});

	await this.page().keyboard().press("Control+V");
});

When("вводим {int} символов", { timeout: 3000 }, async function (this: E2EWorld, i: number) {
	await this.page().keyboard().type(".".repeat(i));
});

Then("проверяем, что картинка загрузилась", async function (this: E2EWorld) {
	const scope = await this.page().search().find("img");
	const img = await scope.elementHandle();
	const src = await img.getAttribute("src");
	expect(src).not.toEqual("data:image;base64,");
});

Then("нажимаем кнопку далее, пока видим её", { timeout: 1000 * 60 * 5 }, async function (this: E2EWorld) {
	const next = await this.page().search().lookup("jump-to-next", undefined, true);
	let counter = 0;

	while ((await next.isVisible()) && counter < 5) {
		counter++;
		await next.click();

		const scope = await this.page().search().lookup("редактор");
		await this.page().waitForLoad(scope);

		const failed = await checkForErrorModal(this);
		if (failed) throw new Error("An error modal found");
	}

	expect(counter).toEqual(5);
});

Then("diff содержит", async function (this: E2EWorld, text: string) {
	const elem = await this.page().search().find(".diff-content");
	expect(await elem.innerText()).toEqual(text);
});
