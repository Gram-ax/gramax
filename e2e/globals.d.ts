/* eslint-disable no-var */
import type { CommandTree } from "@app/commands";
import type { ITestCaseHookParameter } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";
import type App from "../app/types/Application";
import type Debug from "../apps/browser/src/debug";

declare global {
	var page: Page;
	var browser: Browser;
	var context: BrowserContext;
	var scenario: ITestCaseHookParameter;

	interface Window {
		debug: Debug;
		app: App;
		commands: CommandTree;
		refreshPage: () => Promise<void>;
		forceTrollCaller: () => Promise<void>;
	}
}
