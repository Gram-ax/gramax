import EnterpriseUser, { EnterpriseInfo } from "@ext/enterprise/EnterpriseUser";
import EnterpriseUserJSONData from "@ext/enterprise/types/EnterpriseUserJSONData";
import ApiRequest from "../../../logic/Api/ApiRequest";
import ApiResponse from "../../../logic/Api/ApiResponse";
import Cookie from "../../cookie/Cookie";
import User from "./User/User";

export default abstract class AuthManager {
	protected readonly _COOKIE_USER = "user";

	abstract getUser(cookie: Cookie, query: any, headers?: ApiRequest["headers"]): Promise<User>;
	abstract assert(
		req: ApiRequest,
		res: ApiResponse,
		cookie: Cookie,
		onSuccess: (user: User) => Promise<void>,
	): Promise<void>;
	abstract login(req: ApiRequest, res: ApiResponse): Promise<void>;
	abstract logout(cookie: Cookie, req?: ApiRequest, res?: ApiResponse): Promise<void>;

	setUser(cookie: Cookie, user: User, expires?: number): void {
		cookie.set(this._COOKIE_USER, JSON.stringify(user.toJSON()), expires);
	}

	protected async _updateEnterpriseUser(cookie: Cookie, user: EnterpriseUser): Promise<void> {
		const updatedUser = await user.updatePermissions(true);
		if (!updatedUser) return;
		if (updatedUser instanceof EnterpriseUser) this._setUsersEnterpriseInfo(updatedUser, cookie);
		this.setUser(cookie, updatedUser);
	}

	protected async _getEnterpriseUser(cookie: Cookie, json: EnterpriseUserJSONData): Promise<EnterpriseUser> {
		const user = EnterpriseUser.initInJSON(json);
		const info = this._getUsersEnterpriseInfo(user, cookie);
		if (info) user.setEnterpriseInfo(info);
		await this._updateEnterpriseUser(cookie, user);
		return user;
	}

	protected abstract _setUsersEnterpriseInfo(user: EnterpriseUser, cookie: Cookie): void;
	protected abstract _getUsersEnterpriseInfo(user: EnterpriseUser, cookie: Cookie): EnterpriseInfo;
}
