import ThemeManager from "../../extensions/Theme/ThemeManager";
import Cookie from "../../extensions/cookie/Cookie";
import CookieFactory from "../../extensions/cookie/CookieFactory";
import Language, { defaultLanguage } from "../../extensions/localization/core/model/Language";
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
		private _isServerApp?: boolean,
	) {}

	from(req: ApiRequest, res: ApiResponse, query?: { [key: string]: string | string[] }): Context {
		const cookie = this._cookieFactory.from(this._cookieSecret, req, res);
		return this._getContext({
			query,
			cookie,
			domain: apiUtils.getDomain(req),
			user: this._isServerApp ? this._am?.getUser(cookie, query) : localUser,
		});
	}

	fromBrowser(language: Language, query: Query): Context {
		const cookie = this._cookieFactory.from(this._cookieSecret);
		return this._getContext({
			cookie,
			user: localUser,
			domain: getClientDomain(),
			query: { ...query, l: language },
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
			theme: this._tm?.getTheme(cookie),
			lang: (query?.l ?? defaultLanguage) as Language,
		};
	}
}
