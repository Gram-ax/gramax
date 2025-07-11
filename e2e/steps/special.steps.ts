import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "playwright/test";
import GramaxApi from "../models/GramaxApi";
import E2EWorld from "../models/World";
import config from "../setup/config";
import { checkForErrorModal, sleep } from "./utils/utils";

When("отменяем все изменения", { timeout: config.timeouts.long }, async function (this: E2EWorld) {
	const search = this.page().search().reset();
	await search.scope("левую панель");
	await search.scope("нижнюю панель");
	await search.icon("облачка").click();

	const locator = await search.find('[data-qa="qa-no-changes"]');

	if (await locator.isVisible()) {
		await sleep(2000);
		await search.icon("облачка").click();
	} else {
		await search.clickable("выбрать все").hover();
		await search.icon("отмена всех изменений").click();
		await sleep(2000);
		// temp
		await this.page().inner().reload();
	}
	search.reset();
});

When("решаем конфликт", { timeout: config.timeouts.long }, async function (this: E2EWorld) {
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

Then(
	"нажимаем кнопку далее, пока видим её, ожидая что их больше {int}",
	{ timeout: 1000 * 60 * 5 },
	async function (this: E2EWorld, min: number) {
		const next = await this.page().search().lookup("jump-to-next", undefined, true);

		let total = 0;
		while ((await next.count()) > 0) {
			total++;
			try {
				const href = await next.getAttribute("href", { timeout: 500 });
				const currentUrl = this.page().url();
				const hrefPath = href.startsWith(config.url) ? href.slice(config.url.length) : href;
				console.log(currentUrl, "->", hrefPath);

				if (currentUrl.endsWith(hrefPath)) {
					await this.page().inner().reload();
					continue;
				}

				await next.click({ timeout: 500 });
				await this.page().waitForUrl(hrefPath);
			} catch {
				break;
			}

			const scope = await this.page().search().lookup("редактор");
			await this.page().waitForLoad(scope);

			const failed = await checkForErrorModal(this);
			if (failed) throw new Error("An error modal found");
		}

		expect(total).toBeGreaterThanOrEqual(min);
	},
);

Then("diff содержит", async function (this: E2EWorld, text: string) {
	const elem = await this.page().search().find(".diff-content");
	expect(await elem.innerText()).toEqual(text);
});

Given("отключаем интернет", async function (this: E2EWorld) {
	await this.page().inner().context().setOffline(true);
});

Given("включаем интернет", async function (this: E2EWorld) {
	await this.page().inner().context().setOffline(false);
});

Then("проверка API", async function (this: E2EWorld) {
	await sleep(10);
	const gramaxApi = new GramaxApi(config.url);
	const listOfCatalogs = await gramaxApi.getCatalogs();
	const firstCatalogIg = listOfCatalogs.data[0].id;
	const navigation = await gramaxApi.getCatalogNavigation(firstCatalogIg);
	const lastArticleId = navigation.data[navigation.data.length - 1].id;
	const articleHtml = await gramaxApi.getArticleHtml(firstCatalogIg, lastArticleId);
	expect(articleHtml.length > 0).toEqual(true);

	const resourcePath = decodeURIComponent(config.resourcePath);
	const { arrayBuffer, contentType } = await gramaxApi.getResource(firstCatalogIg, lastArticleId, resourcePath);
	expect(contentType).toEqual("application/puml");

	const content = Buffer.from(arrayBuffer).toString().replaceAll("\r", "");
	expect(content).toEqual("@startuml\nBob -> Alice : hello\n@enduml");
});

Then("ошибки {string} содержат", async function (this: E2EWorld, errorTitle: string, errorBlock: string) {
	const expectedErrors = errorBlock
		.trim()
		.split("\n")
		.map((line) => {
			const [articleName, errors] = line.split(":").map((part) => part.trim());
			return { articleName, errors };
		});

	const errorDivLocator = await this.page().search().find(`.errors:has(h3:has-text("${errorTitle}"))`);
	await errorDivLocator.waitFor();
	const rowsLocator = errorDivLocator.locator("table tbody tr");
	const rowCount = await rowsLocator.count();
	expect(rowCount).toEqual(expectedErrors.length);

	for (let i = 0; i < rowCount; i++) {
		const currentRow = rowsLocator.nth(i);
		const currentExpectedErrors = expectedErrors[i];
		const articleName = await currentRow.locator(".article-name span").last().textContent();
		expect(articleName).toEqual(currentExpectedErrors.articleName);

		const errorsLocator = currentRow.locator(".inline-code code");
		const errors = (await errorsLocator.allTextContents()).map((error) => error.trim()).join(", ");
		expect(errors).toEqual(currentExpectedErrors.errors);
	}
});

When("вставляем html", async function (this: E2EWorld, text: string) {
	await this.page()
		.inner()
		.evaluate(async (text) => {
			await window.navigator.clipboard.write([
				new ClipboardItem({ "text/html": new Blob([text], { type: "text/html" }) }),
			]);
		}, text);

	await this.page().keyboard().press("Control+V");
});

When("вставляем текст", async function (this: E2EWorld, text: string) {
	await this.page()
		.inner()
		.evaluate(async (text) => {
			const item = new ClipboardItem({ "text/plain": new Blob([text], { type: "text/plain" }) });
			await window.navigator.clipboard.write([item]);
		}, text);

	await this.page().keyboard().press("Control+V");
});

When("вставляем изображение", async function (this: E2EWorld) {
	const screenshotBuffer = await page.screenshot();
	const screenshotBase64 = screenshotBuffer.toString("base64");

	await this.page()
		.inner()
		.evaluate(async (base64) => {
			const response = await fetch(`data:image/png;base64,${base64}`);
			const item = new ClipboardItem({ "image/png": await response.blob() });
			await navigator.clipboard.write([item]);
		}, screenshotBase64);

	await this.page().keyboard().press("Control+V");
});
