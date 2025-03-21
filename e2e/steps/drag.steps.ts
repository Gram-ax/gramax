import { When } from "@cucumber/cucumber";
import E2EWorld from "e2e/models/World";
import { sleep } from "./utils/utils";

When("перетаскиваем {string} над {string}", async function (this: E2EWorld, sourceName: string, targetName: string) {
	const source = await this.page().search().lookup(sourceName);
	const target = await this.page().search().lookup(targetName);

	await source.dispatchEvent("dragstart");
	await sleep(150);
	await target.dispatchEvent("dragenter");
	await sleep(150);
	await target.dispatchEvent("dragover");
	await sleep(150);
	await target.dispatchEvent("drop");
	await sleep(150);
});

When("перетаскиваем {string} в {string}", async function (this: E2EWorld, sourceName: string, targetName: string) {
	const source = await this.page().search().lookup(sourceName);
	const target = await this.page().search().lookup(targetName);

	const targetClientRect = await target.evaluate((el) => el.getBoundingClientRect());
	const targetY = targetClientRect.y + targetClientRect.height / 2;

	await source.dispatchEvent("dragstart");
	await sleep(150);
	await target.dispatchEvent("dragenter", { clientX: 0, clientY: targetY });
	await sleep(150);
	await target.dispatchEvent("dragover", { clientX: 0, clientY: targetY });
	await sleep(150);
	await target.dispatchEvent("drop", { clientX: 0, clientY: targetY });
	await sleep(150);
});
