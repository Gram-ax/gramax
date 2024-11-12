import LanguageService from "@core-ui/ContextServices/Language";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import ThemeManager from "../../extensions/Theme/ThemeManager";
import Cookie from "../../extensions/cookie/Cookie";
import CookieFactory from "../../extensions/cookie/CookieFactory";
import UiLanguage, { ContentLanguage, defaultLanguage } from "../../extensions/localization/core/model/Language";
import AuthManager from "../../extensions/security/logic/AuthManager";
import User from "../../extensions/security/logic/User/User";
import localUser from "../../extensions/security/logic/User/localUser";
import ApiRequest from "../Api/ApiRequest";
import ApiResponse from "../Api/ApiResponse";
import Query from "../Api/Query";
import { apiUtils } from "../Api/apiUtils";
import { getClientDomain } from "../utils/getClientDomain";
import Context from "./Context";

export class ContextFactory {
	private _cookieFactory = new CookieFactory();
	constructor(
		private _tm: ThemeManager,
		private _cookieSecret: string,
		private _am?: AuthManager,
		private _isReadOnly?: boolean,
	) {}

	async from(req: ApiRequest, res: ApiResponse, query?: { [key: string]: string | string[] }): Promise<Context> {
		const cookie = this._cookieFactory.from(this._cookieSecret, req, res);
		if (!query) query = {};

		query.ui = cookie.get("ui");
		if (!query.l) query.l = ContentLanguage[req.headers["x-gramax-language"]];

		const user = this._isReadOnly ? this._am?.getUser(cookie, query) : localUser;
		if (user.type === "enterprise") await (user as EnterpriseUser).updatePermissions();

		return this._getContext({ cookie, user, query, domain: apiUtils.getDomain(req) });
	}

	fromBrowser(language: string, query: Query): Context {
		const cookie = this._cookieFactory.from(this._cookieSecret);
		if (!query) query = {};
		query.l = language;
		query.ui = LanguageService.currentUi();
		return this._getContext({
			cookie,
			user: localUser,
			domain: getClientDomain(),
			query,
		});
	}

	private _getContext({
		user,
		cookie,
		domain,
		query,
	}: {
		user: User;
		cookie: Cookie;
		domain: string;
		query: { [key: string]: string | string[] };
	}) {
		return {
			user,
			domain,
			cookie,
			contentLanguage: query?.l as ContentLanguage,
			ui: (query?.ui || defaultLanguage) as UiLanguage,
			theme: this._tm?.getTheme(cookie),
			refname: query?.refname as string,
		};
	}
}
