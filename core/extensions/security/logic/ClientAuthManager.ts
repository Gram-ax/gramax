import EnterpriseUser, { EnterpriseInfo } from "@ext/enterprise/EnterpriseUser";
import EnterpriseUserJSONData from "@ext/enterprise/types/EnterpriseUserJSONData";
import AuthManager from "@ext/security/logic/AuthManager";
import { PermissionMapJSONData } from "@ext/security/logic/PermissionMap/IPermissionMap";
import parsePermissionMapFromJSON from "@ext/security/logic/PermissionMap/parsePermissionMapFromJSON";
import localUser from "@ext/security/logic/User/localUser";
import UserJSONData from "@ext/security/logic/User/UserJSONData";
import Cookie from "../../cookie/Cookie";
import User from "./User/User";

interface EnterpriseInfoData {
	workspacePermission: PermissionMapJSONData;
	catalogPermission: PermissionMapJSONData;
	updateDate: string;
	catalogsProps: { [catalogName: string]: { branches?: string[]; mainBranch: string } };
}

export default class ClientAuthManager extends AuthManager {
	private readonly _PERMISSION_COOKIE_NAME = "user_permissions";

	constructor(private _gesUrl: string) {
		super();
	}

	async getUser(cookie: Cookie): Promise<User> {
		const user = await this._getUser(cookie);
		this.setUser(cookie, user);
		return user;
	}

	async assert() {}
	async login() {}
	logout(cookie: Cookie) {
		cookie.remove(this._COOKIE_USER);
		cookie.remove(this._PERMISSION_COOKIE_NAME);
		return Promise.resolve();
	}

	async mailSendOTP() {}
	async mailLoginOTP() {}

	private async _getUser(cookie: Cookie): Promise<User> {
		const userData = cookie.get(this._COOKIE_USER);
		if (!userData || !this._gesUrl) return localUser;

		const json: UserJSONData = JSON.parse(userData);
		if (json.type !== "enterprise") return localUser;

		return this._getEnterpriseUser(cookie, json as EnterpriseUserJSONData);
	}

	protected _getUsersEnterpriseInfo(user: EnterpriseUser, cookie: Cookie): EnterpriseInfo {
		const data = cookie.get(this._PERMISSION_COOKIE_NAME);
		if (!data) return null;
		const parsed: EnterpriseInfoData = JSON.parse(data);
		return this._formatEnterpriseInfo(parsed);
	}

	protected _setUsersEnterpriseInfo(user: EnterpriseUser, cookie: Cookie): void {
		const enterprisePermissionInfo = user.getEnterpriseInfo();
		cookie.set(this._PERMISSION_COOKIE_NAME, JSON.stringify(this._parseEnterpriseInfo(enterprisePermissionInfo)));
	}

	private _parseEnterpriseInfo(enterpriseInfo: EnterpriseInfo): EnterpriseInfoData {
		return {
			workspacePermission: enterpriseInfo.workspacePermission.toJSON(),
			catalogPermission: enterpriseInfo.catalogPermission.toJSON(),
			updateDate: enterpriseInfo.updateDate.toISOString(),
			catalogsProps: enterpriseInfo.catalogsProps,
		};
	}

	private _formatEnterpriseInfo(enterpriseInfo: EnterpriseInfoData): EnterpriseInfo {
		return {
			workspacePermission: parsePermissionMapFromJSON(enterpriseInfo.workspacePermission),
			catalogPermission: parsePermissionMapFromJSON(enterpriseInfo.catalogPermission),
			catalogsProps: enterpriseInfo.catalogsProps,
			updateDate: new Date(enterpriseInfo.updateDate),
		};
	}
}
