import {
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
import { checkForErrorModal } from "../steps/utils/utils";
import config from "./config";

setWorldConstructor(E2EWorld);
setDefaultTimeout(config.timeouts.medium);

let TRACE_DUMP_COUNT = 0;

const makeGlobalContext = async () => {
	await global.context?.close();
	global.context = await browser.newContext({ locale: "ru" });
	const page = await context.newPage();
	await context.tracing.start({ screenshots: true, snapshots: true });
	await page.goto(config.url);
	await page.waitForLoadState("domcontentloaded");
	page.on("dialog", (d) => void d.accept());
	global.page = page;
};

const shouldClearContext = (left: ITestCaseHookParameter, right: ITestCaseHookParameter, deep = 2) => {
	const lhs = left?.gherkinDocument.uri;
	const rhs = right?.gherkinDocument.uri;

	let splits = 0;

	for (let i = 0; i < Math.min(lhs?.length, rhs?.length); i++) {
		if (lhs[i] != rhs[i]) return true;
		if (lhs[i] == "/" || lhs[i] == "\\") splits++;
		if (splits == deep) return false;
	}
	return false;
};

BeforeAll({ timeout: config.timeouts.long * 10 }, async function () {
	await fs.rm(path.resolve(__dirname, "../report"), { recursive: true }).catch(() => undefined);
	global.browser = await chromium.launch(config.launch);
	await makeGlobalContext();
});

Before({ timeout: config.timeouts.long * 10 }, async function (this: E2EWorld, scenario: ITestCaseHookParameter) {
	if (shouldClearContext(global.scenario, scenario)) {
		await context.tracing.stop({ path: "report/tracing/trace-" + ++TRACE_DUMP_COUNT + ".zip" });
		await makeGlobalContext();
	}
	this.setContext(global.page, scenario);
	await this.page().waitForLoad();
	global.scenario = scenario;
});

AfterStep(async function (this: E2EWorld) {
	if ((await checkForErrorModal(this)) && !this.allowErrorModal) throw new Error("An error modal found");
});

AfterAll({ timeout: config.timeouts.long * 4 }, async function () {
	await context.tracing.stop({ path: "report/tracing/trace-" + ++TRACE_DUMP_COUNT + ".zip" });
	await context.pages().at(0).screenshot({ path: "report/screenshot.png", fullPage: true, caret: "initial" });
});
