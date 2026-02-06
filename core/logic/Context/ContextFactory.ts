import LanguageService from "@core-ui/ContextServices/Language";
import type Cookie from "../../extensions/cookie/Cookie";
import CookieFactory from "../../extensions/cookie/CookieFactory";
import UiLanguage, {
	ContentLanguage,
	overriddenLanguage,
	resolveLanguage,
} from "../../extensions/localization/core/model/Language";
import type AuthManager from "../../extensions/security/logic/AuthManager";
import localUser from "../../extensions/security/logic/User/localUser";
import type User from "../../extensions/security/logic/User/User";
import type ThemeManager from "../../extensions/Theme/ThemeManager";
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

export interface FromBrowserArgs {
	language: string;
	query?: Query;
}

export class ContextFactory {
	private _cookieFactory = new CookieFactory();
	constructor(
		private _tm: ThemeManager,
		private _cookieSecret: string,
		private _isReadOnly: boolean,
		private _am?: AuthManager,
	) {}

	async from({ req, res, query }: FromArgs): Promise<Context> {
		const cookie = this._cookieFactory.from(this._cookieSecret, req, res);
		if (!query) query = {};

		query.ui =
			cookie.get("ui") || overriddenLanguage || UiLanguage[req.headers["accept-language"]?.split(",")?.[0]];
		if (!query.l) query.l = ContentLanguage[req.headers["x-gramax-language"]];

		const user = this._isReadOnly ? await this._am?.getUser(cookie, query, req.headers) : localUser;

		return this._getContext({ cookie, user, query, domain: apiUtils.getDomain(req) });
	}

	async fromBrowser({ language, query }: FromBrowserArgs): Promise<Context> {
		const cookie = this._cookieFactory.from(this._cookieSecret);
		if (!query) query = {};
		query.l = language;
		query.ui = LanguageService.currentUi();

		const user = this._am ? await this._am.getUser(cookie, query) : localUser;
		return this._getContext({ cookie, user, query, domain: getClientDomain() });
	}

	private _getContext(props: {
		user: User;
		cookie: Cookie;
		domain: string;
		query: { [key: string]: string | string[] };
	}) {
		const { user, cookie, domain, query } = props;
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
