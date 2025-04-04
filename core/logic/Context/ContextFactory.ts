import LanguageService from "@core-ui/ContextServices/Language";
import ThemeManager from "../../extensions/Theme/ThemeManager";
import Cookie from "../../extensions/cookie/Cookie";
import CookieFactory from "../../extensions/cookie/CookieFactory";
import UiLanguage, { ContentLanguage, overriddenLanguage, resolveLanguage } from "../../extensions/localization/core/model/Language";
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
		private _isReadOnly: boolean,
		private _am?: AuthManager,
	) {}

	async from(req: ApiRequest, res: ApiResponse, query?: { [key: string]: string | string[] }): Promise<Context> {
		const cookie = this._cookieFactory.from(this._cookieSecret, req, res);
		if (!query) query = {};

		query.ui = cookie.get("ui") || overriddenLanguage || UiLanguage[req.headers["accept-language"]?.split(",")?.[0]];
		if (!query.l) query.l = ContentLanguage[req.headers["x-gramax-language"]];

		const user = this._isReadOnly ? await this._am?.getUser(cookie, query, req.headers) : localUser;

		return this._getContext({ cookie, user, query, domain: apiUtils.getDomain(req) });
	}

	async fromBrowser(language: string, query: Query): Promise<Context> {
		const cookie = this._cookieFactory.from(this._cookieSecret);
		if (!query) query = {};
		query.l = language;
		query.ui = LanguageService.currentUi();

		const user = this._am ? await this._am.getUser(cookie, query) : localUser;
		return this._getContext({ cookie, user, query, domain: getClientDomain() });
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
			ui: (query?.ui || resolveLanguage()) as UiLanguage,
			theme: this._tm?.getTheme(cookie),
			refname: query?.refname as string,
		};
	}
}
