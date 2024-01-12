import { Locator } from "playwright";
import config from "../../setup/config";
import { globalIcon } from "../../steps/utils/aliases";
import { PageInfo } from "../Pages/PageContext";
import { ReplaceAlias } from "../World";

export default class SearcherContext {
	constructor(private _alias: ReplaceAlias, private _info: PageInfo) {}

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

		let locator = forceQa
			? was.locator(`[data-qa="${selector}"]`)
			: !alias
			? was
					.locator(`[data-qa="${selector}"]`)
					.or(was.locator("[data-qa]", { hasText: selector }))
					.or(was.locator(alias ?? "text=" + selector))
			: was.locator(alias ?? "text=" + selector);
		locator = locator.locator("visible=true").first();
		if (config.highlight) await locator.highlight();
		return locator;
	}

	async find(selector: string, scope?: Locator) {
		const elem = (scope ?? this._info.scope ?? page).locator(selector).locator("visible=true").last();
		if (config.highlight) await elem.highlight();
		return elem;
	}

	async hover() {
		await this._info.scope.hover();
		return this;
	}

	clickable(text: string, scope?: Locator, all?: boolean) {
		const locator = (scope ?? this._info.scope ?? page)
			.locator('[data-qa="qa-clickable"]')
			.filter({ hasText: text });
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
