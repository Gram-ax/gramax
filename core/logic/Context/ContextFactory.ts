/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import resolveModule from "@app/resolveModule/backend";
import type { AppliedCatalogsView } from "@ext/catalog/views/models/CatalogViews";
import { getCachedSetting } from "@ext/settings/logic/cachedSettingsStore";
import type Cookie from "../../extensions/cookie/Cookie";
import UiLanguage, {
	ContentLanguage,
	overriddenLanguage,
	resolveLanguage,
} from "../../extensions/localization/core/model/Language";
import type AuthManager from "../../extensions/security/logic/AuthManager";
import type User from "../../extensions/security/logic/User/User";
import type Theme from "../../extensions/Theme/Theme";
import { validateTheme } from "../../extensions/Theme/utils";
import type ApiRequest from "../Api/ApiRequest";
import type ApiResponse from "../Api/ApiResponse";
import { apiUtils } from "../Api/apiUtils";
import type Query from "../Api/Query";
import { getClientDomain } from "../utils/getClientDomain";
import type Context from "./Context";

export interface FromArgs {
	req: ApiRequest;
	res: ApiResponse;
	query?: Query;
}

export interface FromWebArgs {
	language: string;
	query?: Query;
}

export class ContextFactory {
	constructor(
		private _cookieSecret: string,
		private _am: AuthManager,
	) {}

	async fromNode({ req, res, query }: FromArgs): Promise<Context> {
		const ResolveCookie = resolveModule("Cookie");
		const cookie = new ResolveCookie(this._cookieSecret, req as any, res as any);
		if (!query) query = {};

		const headerUiLang = req.headers["x-gramax-ui-language"] as string | undefined;
		const headerTheme = req.headers["x-gramax-theme"] as string | undefined;

		query.ui =
			(headerUiLang && UiLanguage[headerUiLang]) ||
			overriddenLanguage ||
			UiLanguage[req.headers["accept-language"]?.split(",")?.[0]];
		if (!query.l) query.l = ContentLanguage[req.headers["x-gramax-language"]];

		const user = await this._am.getUser(cookie, query, req.headers);

		return this._getContext({
			cookie,
			user,
			query,
			domain: apiUtils.getDomain(req),
			viewId: cookie.get("viewIds"),
			theme: headerTheme ? validateTheme(headerTheme) : undefined,
		});
	}

	async fromWeb({ language, query }: FromWebArgs): Promise<Context> {
		const ResolveCookie = resolveModule("Cookie");
		const cookie = new ResolveCookie(this._cookieSecret, null, null);
		if (!query) query = {};
		query.l = language;
		query.ui = getCachedSetting("general.language");

		const user = await this._am.getUser(cookie, query);
		return this._getContext({ cookie, user, query, domain: getClientDomain(), viewId: cookie.get("viewIds") });
	}

	private _getContext(props: {
		user: User;
		cookie: Cookie;
		domain: string;
		query: { [key: string]: string | string[] };
		viewId: string;
		theme?: Theme;
	}) {
		const { user, cookie, domain, query, viewId, theme } = props;
		return {
			user,
			domain,
			cookie,
			contentLanguage: query?.l as ContentLanguage,
			ui: (query?.ui || resolveLanguage()) as UiLanguage,
			theme,
			refname: query?.refname as string,
			viewId: JSON.parse(viewId || "{}") as AppliedCatalogsView,
			toSpan: () => "<redacted>",
		};
	}
}
