import Context from "@core/Context/Context";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import ShowHomePageRules from "@core/FileStructue/Rules/ShowHomePageRule/ShowHomePageRule";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import LocalizationRules from "@ext/localization/core/events/LocalizationEvents";
import RuleCollection from "@ext/rules/RuleCollection";
import SecurityRules from "@ext/security/logic/SecurityRules";

class RuleProvider {
	private _rules: RuleCollection[];

	constructor(ctx: Context, customArticlePresenter?: CustomArticlePresenter) {
		this._rules = [
			new ShowHomePageRules(),
			new HiddenRules(null, customArticlePresenter),
			new LocalizationRules(null, ctx.contentLanguage, customArticlePresenter),
			new SecurityRules(ctx.user, null, customArticlePresenter),
		];
	}

	getItemFilters() {
		return this._rules.map((r) => r.getItemFilter());
	}
}

export default RuleProvider;
