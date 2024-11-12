import type Context from "@core/Context/Context";
import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import type { NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import ShowHomePageRules from "@core/FileStructue/Rules/ShowHomePageRule/ShowHomePageRule";
import type CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import LocalizationRules from "@ext/localization/core/events/LocalizationEvents";
import SecurityRules from "@ext/security/logic/SecurityRules";

export default class NavigationEventHandlers extends EventHandlerProvider<NavigationEvents> {
	constructor(ctx: Context, customArticlePresenter?: CustomArticlePresenter) {
		super();
		this._handlers = [
			new ShowHomePageRules(),
			new HiddenRules(customArticlePresenter),
			new LocalizationRules(ctx.contentLanguage, customArticlePresenter),
			new SecurityRules(ctx.user, customArticlePresenter),
		];
	}
}
