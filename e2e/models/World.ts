import { ITestCaseHookParameter, IWorldOptions, World } from "@cucumber/cucumber";
import { Page as PlaywrightPage } from "playwright";
import { Aliases, globalAlias } from "../steps/utils/aliases";
import { FPContext } from "./Contexts/FPContext";
import PageContext from "./Pages/PageContext";

export type ReplaceAlias = (alias: string, or?: () => string) => string;

export default class E2EWorld extends World {
	allowErrorModal = false;

	private _page: PageContext;
	private _aliases: Aliases = {};
	private _scenario: ITestCaseHookParameter;

	constructor(params: IWorldOptions<any>) {
		super(params);
	}

	page() {
		return this._page;
	}

	aliases(aliases: Aliases) {
		this._aliases = { ...this._aliases, ...aliases };
		return this;
	}

	replace(val: string, or?: () => string) {
		return this._aliases?.[val] ?? globalAlias(val) ?? or?.();
	}

	scenario() {
		return this._scenario;
	}

	async fp() {
		const handle = await this._page.inner().evaluateHandle(() => window.app.wm.current().getFileProvider());
		return new FPContext(handle);
	}

	setContext(page: PlaywrightPage, scenario: ITestCaseHookParameter) {
		this._page = new PageContext(page, this.replace.bind(this), this._aliases);
		this._scenario = scenario;
		this._aliases = {};
	}
}
