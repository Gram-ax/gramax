import type { EnterpriseConfig } from "@app/config/AppConfig";
import type Query from "@core/Api/Query";
import EnterpriseUser, { type EnterpriseInfo } from "@ext/enterprise/EnterpriseUser";
import type EnterpriseUserJSONData from "@ext/enterprise/types/EnterpriseUserJSONData";
import AuthManager from "@ext/security/logic/AuthManager";
import TicketUser from "@ext/security/logic/TicketManager/TicketUser";
import type UserJSONData from "@ext/security/logic/User/UserJSONData";
import type ApiRequest from "../../../logic/Api/ApiRequest";
import type ApiResponse from "../../../logic/Api/ApiResponse";
import type Cookie from "../../cookie/Cookie";
import TokenValidationError from "../../publicApi/TokenValidationError";
import type { AuthProvider } from "./AuthProviders/AuthProvider";
import type { TicketManager } from "./TicketManager/TicketManager";
import User from "./User/User";

const QUERY_TICKET = "t";

export default class ServerAuthManager extends AuthManager {
	protected _usersEnterprisePermissionInfo: Record<string, EnterpriseInfo> = {};

	constructor(
		private _ap: AuthProvider,
		private _ticketManager: TicketManager,
		enterpriseConfig: EnterpriseConfig,
	) {
		super(enterpriseConfig);
	}

	async login(req: ApiRequest, res: ApiResponse) {
		return await this._ap.login(req, res);
	}

	async logout(cookie: Cookie, req: ApiRequest, res: ApiResponse) {
		cookie.remove(this._COOKIE_USER);
		return await this._ap.logout(req, res);
	}

	async assert(req: ApiRequest, res: ApiResponse, cookie: Cookie, onSuccess: (user: User) => Promise<void>) {
		return await this._ap.assertEndpoint(req, res, cookie, async (cookie: Cookie, user: User) => {
			this.setUser(cookie, user);
			await onSuccess(user);
		});
	}

	async mailSendOTP(req: ApiRequest, res: ApiResponse) {
		return await this._ap.mailSendOTP(req, res);
	}

	async mailLoginOTP(req: ApiRequest, res: ApiResponse) {
		return await this._ap.mailLoginOTP(req, res);
	}

	async getUser(cookie: Cookie, query: Query, headers: ApiRequest["headers"]): Promise<User> {
		if (query?.[QUERY_TICKET]) {
			const shareTicket = decodeURIComponent(query[QUERY_TICKET]);
			const ticketUser = this._ticketManager.checkShareTicket(shareTicket);
			if (ticketUser) {
				this.setUser(cookie, ticketUser);
				return ticketUser;
			}
		}

		const user = await this._getUser(cookie);

		if (!this._enterpriseConfig?.gesUrl) {
			this.setUser(cookie, user);
			return user;
		}

		const authorizationToken = this._extractAuthorizationToken(headers);
		if (authorizationToken) {
			const userTicket = decodeURIComponent(authorizationToken);
			const ticketUser = await this._ticketManager.checkUserTicket(userTicket, this._enterpriseConfig);
			if (!ticketUser) throw new TokenValidationError("Invalid token");
			return ticketUser;
		}

		this.setUser(cookie, user);
		return user;
	}

	private async _getUser(cookie: Cookie): Promise<User> {
		const userData = cookie.get(this._COOKIE_USER);
		if (!userData) return this._getAnonymousUser();

		const json: UserJSONData = JSON.parse(userData);
		switch (json.type) {
			case "enterprise": {
				return await this._getEnterpriseUser(json as EnterpriseUserJSONData);
			}
			case "ticket": {
				return TicketUser.initInJSON(json);
			}
			default: {
				return User.initInJSON(json);
			}
		}
	}

	private async _getAnonymousUser(): Promise<User> {
		if (!this._enterpriseConfig?.gesUrl) {
			return new User();
		}

		const user = new EnterpriseUser(false, null, null, null, null, this._enterpriseConfig);
		await this._updateEnterpriseUser(user);
		return user;
	}

	protected async _getEnterpriseUser(json: EnterpriseUserJSONData): Promise<EnterpriseUser> {
		const user = EnterpriseUser.initInJSON(json, this._enterpriseConfig);
		await this._updateEnterpriseUser(user);
		return user;
	}

	protected async _updateEnterpriseUser(user: EnterpriseUser): Promise<void> {
		const info = this._getUsersEnterpriseInfo(user);
		if (info) user.setEnterpriseInfo(info);

		const updatedUser = await user.updatePermissions();
		if (!updatedUser) return;

		this._setUsersEnterpriseInfo(updatedUser);
	}

	private _setUsersEnterpriseInfo(user: EnterpriseUser): void {
		this._usersEnterprisePermissionInfo[user?.info?.mail ?? ""] = user.getEnterpriseInfo();
	}

	protected _getUsersEnterpriseInfo(user: EnterpriseUser): EnterpriseInfo {
		return this._usersEnterprisePermissionInfo[user?.info?.mail ?? ""];
	}

	private _extractAuthorizationToken(headers: ApiRequest["headers"]): string {
		const authorizationHeader = headers?.authorization;
		if (!authorizationHeader) return "";
		if (!authorizationHeader.startsWith("Bearer ")) throw new TokenValidationError("Invalid authorization header");
		return authorizationHeader.slice(7);
	}
}
