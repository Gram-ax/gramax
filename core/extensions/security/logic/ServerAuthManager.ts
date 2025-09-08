import EnterpriseUser, { EnterpriseInfo } from "@ext/enterprise/EnterpriseUser";
import EnterpriseUserJSONData from "@ext/enterprise/types/EnterpriseUserJSONData";
import AuthManager from "@ext/security/logic/AuthManager";
import UserJSONData from "@ext/security/logic/User/UserJSONData";
import ApiRequest from "../../../logic/Api/ApiRequest";
import ApiResponse from "../../../logic/Api/ApiResponse";
import Cookie from "../../cookie/Cookie";
import { AuthProvider } from "./AuthProviders/AuthProvider";
import { TicketManager } from "./TicketManager/TicketManager";
import User from "./User/User";

const QUERY_TICKET = "t";

export default class ServerAuthManager extends AuthManager {
	protected _usersEnterprisePermissionInfo: Record<string, EnterpriseInfo> = {};

	constructor(private _ap: AuthProvider, private _ticketManager: TicketManager, private _gesUrl: string) {
		super();
	}

	async getUser(cookie: Cookie, query: any, headers: ApiRequest["headers"]): Promise<User> {
		let user: User = await this._getUser(cookie);

		if (query?.[QUERY_TICKET]) {
			const shareTicket = decodeURIComponent(query[QUERY_TICKET]);
			const ticketUser = this._ticketManager.checkShareTicket(shareTicket);
			if (ticketUser) user = ticketUser;
			this.setUser(cookie, user);
		}

		const authorizationHeader = headers?.["authorization"];
		const authorizationToken = authorizationHeader?.startsWith("Bearer ") ? authorizationHeader.slice(7) : "";
		if (authorizationToken) {
			const userTicket = decodeURIComponent(authorizationToken);
			const ticketUser = await this._ticketManager.checkUserTicket(userTicket);
			if (ticketUser) user = ticketUser;
		}

		return user;
	}

	async assert(req: ApiRequest, res: ApiResponse, cookie: Cookie, onSuccess: (user: User) => Promise<void>) {
		return await this._ap.assertEndpoint(req, res, cookie, async (cookie: Cookie, user: User) => {
			this.setUser(cookie, user);
			if (user.type === "enterprise") await this._updateEnterpriseUser(cookie, user as EnterpriseUser);
			await onSuccess(user);
		});
	}

	async login(req: ApiRequest, res: ApiResponse) {
		return await this._ap.login(req, res);
	}

	async logout(cookie: Cookie, req: ApiRequest, res: ApiResponse) {
		cookie.remove(this._COOKIE_USER);
		return await this._ap.logout(req, res);
	}

	async mailSendOTP(req: ApiRequest, res: ApiResponse) {
		return await this._ap.mailSendOTP(req, res);
	}

	async mailLoginOTP(req: ApiRequest, res: ApiResponse) {
		return await this._ap.mailLoginOTP(req, res);
	}

	private async _getAnonymousUser(cookie: Cookie): Promise<User> {
		if (!this._gesUrl) return new User();
		const user = new EnterpriseUser(false, null, null, null, null, this._gesUrl);
		user.setEnterpriseInfo(this._getUsersEnterpriseInfo(user));
		await this._updateEnterpriseUser(cookie, user);
		return user;
	}

	private async _getUser(cookie: Cookie): Promise<User> {
		const userData = cookie.get(this._COOKIE_USER);
		if (!userData) return this._getAnonymousUser(cookie);
		const json: UserJSONData = JSON.parse(userData);
		if (json.type === "enterprise") {
			const user = await this._getEnterpriseUser(cookie, json as EnterpriseUserJSONData);
			if (!user) return this._getAnonymousUser(cookie);
			return user;
		}
		return User.initInJSON(json);
	}

	protected _getUsersEnterpriseInfo(user: EnterpriseUser): EnterpriseInfo {
		return this._usersEnterprisePermissionInfo[user?.info?.mail ?? ""];
	}

	protected _setUsersEnterpriseInfo(user: EnterpriseUser): void {
		this._usersEnterprisePermissionInfo[user?.info?.mail ?? ""] = user.getEnterpriseInfo();
	}
}
