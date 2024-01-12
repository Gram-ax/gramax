import {
	After,
	AfterAll,
	AfterStep,
	Before,
	BeforeAll,
	ITestCaseHookParameter,
	setDefaultTimeout,
	setWorldConstructor,
} from "@cucumber/cucumber";
import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";
import E2EWorld from "../models/World";
import config from "./config";
import { checkForErrorModal, dumpAllLogs, dumpLogs, onConsoleMessage } from "./logs";

setWorldConstructor(E2EWorld);
setDefaultTimeout(config.timeouts.medium);

BeforeAll({ timeout: config.timeouts.long }, async function () {
	await fs.rm(path.resolve(__dirname, "../report"), { recursive: true }).catch(() => undefined);
	global.browser = await chromium.launch(config.launch);
	global.context = await browser.newContext({
		recordVideo: { dir: path.resolve(__dirname, "../report"), size: { height: 720, width: 1080 } },
		permissions: ["clipboard-read", "clipboard-write"],
	});
	const page = await context.newPage();
	await page.goto(config.url);
	await page.waitForLoadState("domcontentloaded");
	await page.evaluate(() => ((window as any).confirm = () => true));
	page.on("console", onConsoleMessage);
	global.page = page;
});

Before({ timeout: config.timeouts.long }, function (this: E2EWorld, scenario: ITestCaseHookParameter) {
	this.setContext(global.page, scenario);
});

AfterStep(async function (this: E2EWorld, scenario: ITestCaseHookParameter) {
	if (await checkForErrorModal(this, scenario.gherkinDocument.uri)) throw new Error("An error modal found");
});

After(async function (this: E2EWorld, scenario: ITestCaseHookParameter) {
	await dumpLogs(
		this,
		scenario.result.status != "PASSED",
		scenario.gherkinDocument.uri.replace("features/", ""),
		"console.error",
		scenario.pickle.name,
	);
});

AfterAll(async function () {
	await dumpAllLogs();
});
