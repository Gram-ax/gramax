import Context from "@core/Context/Context";
import type { HasEvents } from "@core/Event/EventEmitter";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import ShowHomePageRules from "@core/FileStructue/Rules/ShowHomePageRule/ShowHomePageRule";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import LocalizationRules from "@ext/localization/core/events/LocalizationEvents";
import type { NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";
import RuleCollection from "@ext/rules/RuleCollection";
import SecurityRules from "@ext/security/logic/SecurityRules";

class RuleProvider {
	private _rules: RuleCollection[];

	constructor(ctx: Context, customArticlePresenter?: CustomArticlePresenter) {
		this._rules = [
			new ShowHomePageRules(),
			new HiddenRules(customArticlePresenter),
			new LocalizationRules(ctx.contentLanguage, customArticlePresenter),
			new SecurityRules(ctx.user, customArticlePresenter),
		];
	}

	mountNavEvents(nav: HasEvents<NavigationEvents>) {
		for (const rules of this._rules) rules.mountNavEvents(nav);
	}

	getItemFilters() {
		return this._rules.map((r) => r.getItemFilter());
	}
}

export default RuleProvider;
