import EnterpriseUser, { EnterprisePermissionInfo } from "@ext/enterprise/EnterpriseUser";
import EnterpriseUserJSONData from "@ext/enterprise/types/EnterpriseUserJSONData";
import UserJSONData from "@ext/security/logic/User/UserJSONData";
import ApiRequest from "../../../logic/Api/ApiRequest";
import ApiResponse from "../../../logic/Api/ApiResponse";
import Cookie from "../../cookie/Cookie";
import { AuthProvider } from "./AuthProviders/AuthProvider";
import { TicketManager } from "./TicketManager/TicketManager";
import User from "./User/User";

const COOKIE_USER = "user";
const QUERY_TICKET = "t";

export default class AuthManager {
	private _usersEnterprisePermissionInfo: Record<string, EnterprisePermissionInfo> = {};

	constructor(private _ap: AuthProvider, private _ticketManager: TicketManager, private _gesUrl: string) {}

	async getUser(cookie: Cookie, query: any): Promise<User> {
		let user: User = await this._getUser(cookie);
		if (!query?.[QUERY_TICKET]) return user;
		const { catalogPermissions, user: ticketUser } = this._ticketManager.checkTicket(
			decodeURIComponent(query[QUERY_TICKET]),
		);
		Object.keys(catalogPermissions).forEach((catalogName) => {
			user.setCatalogPermission(catalogName, catalogPermissions[catalogName]);
		});
		if (ticketUser) user = ticketUser;
		this._setUser(cookie, user, 60 * 60);
		return user;
	}

	getMailLoginTicket(mail: string) {
		const user: User = new User(true, { mail, name: mail, id: mail });
		return this._ticketManager.getUserTicket(user);
	}

	async assert(req: ApiRequest, res: ApiResponse, cookie: Cookie, onSuccess: (user: User) => Promise<void>) {
		return await this._ap.assertEndpoint(req, res, cookie, async (cookie: Cookie, user: User) => {
			this._setUser(cookie, user);
			await onSuccess(user);
		});
	}

	async login(req: ApiRequest, res: ApiResponse) {
		return await this._ap.login(req, res);
	}

	async logout(cookie: Cookie, req: ApiRequest, res: ApiResponse) {
		cookie.remove(COOKIE_USER);
		return await this._ap.logout(req, res);
	}

	private _setUser(cookie: Cookie, user: User, expires?: number): void {
		cookie.set(COOKIE_USER, JSON.stringify(user.toJSON()), expires);
	}

	private async _getUser(cookie: Cookie): Promise<User> {
		const userData = cookie.get(COOKIE_USER);
		if (!userData) {
			if (!this._gesUrl) return new User();
			const user = new EnterpriseUser(false, undefined, undefined, undefined, this._gesUrl);
			user.setPermissionInfo(this._getUsersEnterprisePermissionInfo(user));
			await this._updateEnterpriseUser(cookie, user);
			return user;
		}
		const json: UserJSONData = JSON.parse(userData);
		if (json.type === "enterprise") {
			const user = EnterpriseUser.initInJSON(json as EnterpriseUserJSONData);
			user.setPermissionInfo(this._getUsersEnterprisePermissionInfo(user));
			await this._updateEnterpriseUser(cookie, user);
			return user;
		}
		return User.initInJSON(json);
	}

	private async _updateEnterpriseUser(cookie: Cookie, user: EnterpriseUser): Promise<void> {
		await user.updatePermissions((user) => {
			this._setUsersEnterprisePermissionInfo(user);
			this._setUser(cookie, user);
		});
	}

	private _getUsersEnterprisePermissionInfo(user: EnterpriseUser): EnterprisePermissionInfo {
		return this._usersEnterprisePermissionInfo[user?.info?.mail ?? ""];
	}

	private _setUsersEnterprisePermissionInfo(user: EnterpriseUser): void {
		this._usersEnterprisePermissionInfo[user?.info?.mail ?? ""] = user.getEnterprisePermissionsInfo();
	}
}
