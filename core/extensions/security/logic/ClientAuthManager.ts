import EnterpriseUser, { type EnterpriseInfo } from "@ext/enterprise/EnterpriseUser";
import type EnterpriseUserJSONData from "@ext/enterprise/types/EnterpriseUserJSONData";
import AuthManager from "@ext/security/logic/AuthManager";
import type { PermissionMapJSONData } from "@ext/security/logic/PermissionMap/IPermissionMap";
import parsePermissionMapFromJSON from "@ext/security/logic/PermissionMap/parsePermissionMapFromJSON";
import localUser from "@ext/security/logic/User/localUser";
import type UserJSONData from "@ext/security/logic/User/UserJSONData";
import type Cookie from "../../cookie/Cookie";
import type User from "./User/User";

interface EnterpriseInfoData {
	workspacePermission: PermissionMapJSONData;
	catalogPermission: PermissionMapJSONData;
	updateDate: string;
	catalogsProps: {
		[catalogName: string]: { branches?: string[]; mainBranch: string };
	};
}

export default class ClientAuthManager extends AuthManager {
	private readonly _PERMISSION_COOKIE_NAME = "user_permissions";
	private _isStartedUpdatePermissions: boolean;

	async login() {}
	async assert() {}
	async mailSendOTP() {}
	async mailLoginOTP() {}

	logout(cookie: Cookie) {
		cookie.remove(this._COOKIE_USER);
		cookie.remove(this._PERMISSION_COOKIE_NAME);
		return Promise.resolve();
	}

	async getUser(cookie: Cookie): Promise<User> {
		if (!this._enterpriseConfig.gesUrl) return localUser;

		const userData = cookie.get(this._COOKIE_USER);
		if (!userData) return localUser;

		const json: UserJSONData = JSON.parse(userData);
		if (json.type !== "enterprise") return localUser;

		const user = this._getEnterpriseUser(cookie, json as EnterpriseUserJSONData);
		this.setUser(cookie, user);
		return user;
	}

	async forceUpdateEnterpriseUser(cookie: Cookie, user: EnterpriseUser) {
		if (!this._enterpriseConfig?.gesUrl || !user || user.type !== "enterprise") return;

		const updatedUser = await user.updatePermissions(true);
		if (!updatedUser) return;
		this._setUsersEnterpriseInfo(updatedUser, cookie);
		this.setUser(cookie, updatedUser);
	}

	protected _getEnterpriseUser(cookie: Cookie, json: EnterpriseUserJSONData): EnterpriseUser {
		const user = EnterpriseUser.initInJSON(json, this._enterpriseConfig);
		const info = this._getUsersEnterpriseInfo(user, cookie);
		if (info) user.setEnterpriseInfo(info);
		void this._updateEnterpriseUser(cookie, user); // Run the update asynchronously without awaiting it to avoid blocking the homepage render/load when GES responses are slow (large timeout)
		return user;
	}

	protected async _updateEnterpriseUser(cookie: Cookie, user: EnterpriseUser): Promise<void> {
		if (this._isStartedUpdatePermissions) return;

		this._isStartedUpdatePermissions = true;
		const updatedUser = await user.updatePermissions();
		this._isStartedUpdatePermissions = false;
		if (!updatedUser) return;

		this._setUsersEnterpriseInfo(updatedUser, cookie);
	}

	protected _getUsersEnterpriseInfo(_, cookie: Cookie): EnterpriseInfo {
		const data = cookie.get(this._PERMISSION_COOKIE_NAME);
		if (!data) return null;
		const parsed: EnterpriseInfoData = JSON.parse(data);
		return this._formatEnterpriseInfo(parsed);
	}

	private _setUsersEnterpriseInfo(user: EnterpriseUser, cookie: Cookie): void {
		const enterprisePermissionInfo = user.getEnterpriseInfo();
		cookie.set(this._PERMISSION_COOKIE_NAME, JSON.stringify(this._parseEnterpriseInfo(enterprisePermissionInfo)));
	}

	private _formatEnterpriseInfo(enterpriseInfo: EnterpriseInfoData): EnterpriseInfo {
		return {
			workspacePermission: parsePermissionMapFromJSON(enterpriseInfo.workspacePermission),
			catalogPermission: parsePermissionMapFromJSON(enterpriseInfo.catalogPermission),
			catalogsProps: enterpriseInfo.catalogsProps,
			updateDate: new Date(enterpriseInfo.updateDate),
		};
	}

	private _parseEnterpriseInfo(enterpriseInfo: EnterpriseInfo): EnterpriseInfoData {
		return {
			workspacePermission: enterpriseInfo.workspacePermission.toJSON(),
			catalogPermission: enterpriseInfo.catalogPermission.toJSON(),
			updateDate: enterpriseInfo.updateDate.toISOString(),
			catalogsProps: enterpriseInfo.catalogsProps,
		};
	}
}
