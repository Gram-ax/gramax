import { Then, When } from "@cucumber/cucumber";
import { expect } from "playwright/test";
import E2EWorld from "../models/World";
import { checkForErrorModal, dumpLogs } from "../setup/logs";

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
	const next = await this.page().search().lookup("jump-to-next");
	while (await next.isVisible()) {
		await next.click();

		const scope = await this.page().search().lookup("редактор");
		await this.page().waitForLoad(scope);

		const url = this.page().url().replace("/test-catalog/", "").replaceAll("/", ".");

		const failed = await checkForErrorModal(this, url);
		await dumpLogs(this, failed, this.scenario().gherkinDocument.uri.replace("features/", ""), `${url}.error`, url);
		if (failed) throw new Error("An error modal found");
	}
});

Then("diff содержит", async function (this: E2EWorld, text: string) {
	const elem = await this.page().search().find(".diff-content");
	expect(await elem.innerText()).toEqual(text);
});
