/* eslint-disable no-var */
import type { CommandTree } from "@app/commands";
import type { Browser, BrowserContext, Page } from "playwright";
import type App from "../app/types/Application";
import type Debug from "../target/browser/src/debug";

declare global {
	var page: Page;
	var browser: Browser;
	var context: BrowserContext;

	interface Window {
		debug: Debug;
		app: App;
		commands: CommandTree;
		refreshPage: () => Promise<void>;
		forceTrollCaller: () => Promise<void>;
	}
}
