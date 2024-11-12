import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import ApiRequest from "../../../logic/Api/ApiRequest";
import ApiResponse from "../../../logic/Api/ApiResponse";
import Cookie from "../../cookie/Cookie";
import { AuthProvider } from "./AuthProviders/AuthProvider";
import { TicketManager } from "./TicketManager/TicketManager";
import User from "./User/User";

const COOKIE_USER = "user";
const QUERY_TICKET = "t";

export default class AuthManager {
	constructor(private _ap: AuthProvider, private _ticketManager: TicketManager, private _gesUrl: string) {}

	getUser(cookie: Cookie, query: any): User {
		let user: User = this._getUser(cookie);
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

	async assert(req: ApiRequest, res: ApiResponse, cookie: Cookie) {
		return await this._ap.assertEndpoint(req, res, cookie, this._setUser.bind(this));
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

	private _getUser(cookie: Cookie): User {
		const userData = cookie.get(COOKIE_USER);
		if (!userData) {
			if (!this._gesUrl) return new User();
			const user = new EnterpriseUser(false, undefined, undefined, undefined, this._gesUrl);
			this._setUser(cookie, user);
			return user;
		}
		const json = JSON.parse(userData);
		if (json.type === "enterprise") return EnterpriseUser.initInJSON(json);
		return User.initInJSON(json);
	}
}
