import fs from "fs/promises";
import path from "path";
import { ConsoleMessage } from "playwright";
import E2EWorld from "../models/World";
import config from "./config";

const logs = [];
let errors = [];

export const onConsoleMessage = (message: ConsoleMessage) => {
	const loc = message.location();
	logs.push(`[${message.type()}] ${message.text()}\nLocation: ${loc.url}:${loc.lineNumber}:${loc.columnNumber}`);
	if (message.type() == "error") errors.push(logs.at(-1));
};

export const checkForErrorModal = async (world: E2EWorld, header: string) => {
	logs.push(`#### ${header} ####`);
	return (await world.page().inner().locator(`[data-qa="qa-error-modal"]`).count()) > 0;
};

export const dumpLogs = async (
	world: E2EWorld,
	failed: boolean,
	whereToSave: string,
	logname: string,
	screenshotname: string,
) => {
	if (errors.length > 0) {
		const out = path.resolve(__dirname, "../report", whereToSave);
		await fs.mkdir(out, { recursive: true }).catch(() => undefined);
		await fs.writeFile(path.resolve(out, `${logname}.log`), errors.reverse().join("\n\n"));
		errors = [];
	}

	if (failed && config.screenshots) {
		await world
			.page()
			.inner()
			.screenshot({
				fullPage: true,
				type: "png",
				path: path.resolve(__dirname, "../report/", whereToSave, `${screenshotname}.png`),
			});
	}
};

export const dumpAllLogs = async () => {
	await fs.mkdir(path.resolve(__dirname, "../report")).catch(() => undefined);
	await fs.writeFile(path.resolve(__dirname, "../report", "console.log"), logs.reverse().join("\n\n"));
};