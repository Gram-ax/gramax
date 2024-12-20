import type Context from "@core/Context/Context";
import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import ShowHomePageRules from "@core/FileStructue/Rules/ShowHomePageRule/ShowHomePageRule";
import type CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import { EnrichNavigationTreeWithStatus } from "@ext/git/events/EnrichNavigationTreeWithStatus";
import LocalizationRules from "@ext/localization/core/events/LocalizationEvents";
import type Navigation from "@ext/navigation/catalog/main/logic/Navigation";
import SecurityRules from "@ext/security/logic/SecurityRules";

export default class NavigationEventHandlers extends EventHandlerProvider {
	constructor(nav: Navigation, ctx: Context, customArticlePresenter?: CustomArticlePresenter) {
		super();
		this._handlers = [
			new ShowHomePageRules(nav),
			new HiddenRules(nav, customArticlePresenter),
			new LocalizationRules(nav, ctx.contentLanguage, customArticlePresenter),
			new SecurityRules(ctx.user, nav, customArticlePresenter),
			new EnrichNavigationTreeWithStatus(nav),
		];
	}
}
