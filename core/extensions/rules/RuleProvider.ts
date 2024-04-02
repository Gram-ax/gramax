import Context from "@core/Context/Context";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import ShowHomePageRules from "@core/FileStructue/Rules/ShowHomePageRule/ShowHomePageRule";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import LocalizationRules from "@ext/localization/core/rules/LocalizationRules";
import Rules from "@ext/rules/Rule";
import SecurityRules from "@ext/security/logic/SecurityRules";

class RuleProvider {
	private _rules: Rules[];
	constructor(ctx: Context, customArticlePresenter?: CustomArticlePresenter) {
		this._rules = [
			new ShowHomePageRules(),
			new HiddenRules(customArticlePresenter),
			new LocalizationRules(ctx.lang, customArticlePresenter),
			new SecurityRules(ctx.user, customArticlePresenter),
		];
	}

	getNavRules() {
		return this._rules.map((r) => r.getNavRules());
	}

	getItemFilters() {
		return this._rules.map((r) => r.getItemFilter());
	}
}

export default RuleProvider;
