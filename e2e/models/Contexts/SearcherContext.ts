import { Locator } from "playwright";
import config from "../../setup/config";
import { Aliases, globalIcon } from "../../steps/utils/aliases";
import { replaceMultiple } from "../../steps/utils/utils";
import { PageInfo } from "../Pages/PageContext";
import { ReplaceAlias } from "../World";

export default class SearcherContext {
	constructor(private _alias: ReplaceAlias, private _aliases: Aliases, private _info: PageInfo) {}

	current() {
		return this._info.scope;
	}

	async scope(selector: string, by: "lookup" | "find" = "lookup") {
		this._info.scope = by == "lookup" ? await this.lookup(selector) : await this.find(selector);
		return this;
	}

	reset() {
		this._info.scope = undefined;
		return this;
	}

	async lookup(selector: string, scope?: Locator, forceQa?: boolean) {
		const was = scope ?? this._info.scope ?? page;
		const alias = this._alias(selector);
		const makeLocator = () => {
			if (forceQa) return was.locator(`[data-qa="${selector}"]`);
			if (alias) return was.locator(alias);
			return was.locator("[data-qa]", { hasText: selector });
		};
		const locator = makeLocator().first();
		if (config.highlight) await locator.highlight();
		return locator;
	}

	async find(selector: string, scope?: Locator) {
		const elem = (scope ?? this._info.scope ?? page).locator(selector).last();
		if (config.highlight) await elem.highlight();
		return elem;
	}

	async hover() {
		await this._info.scope.hover();
		return this;
	}

	clickable(text: string, scope?: Locator, all?: boolean) {
		const locator = (scope ?? this._info.scope ?? page).locator('[data-qa="qa-clickable"]', {
			hasText: replaceMultiple(text, this._alias.bind(this)),
		});
		return all ? locator : locator.first();
	}

	icon(shorthand: string, scope?: Locator) {
		return (scope ?? this._info.scope ?? page).locator(globalIcon(shorthand)).first();
	}

	async focus() {
		await this._info.scope?.focus({ timeout: config.timeouts.short });
		return this;
	}
}
