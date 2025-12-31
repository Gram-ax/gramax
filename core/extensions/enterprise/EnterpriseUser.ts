import { EnterpriseConfig } from "@app/config/AppConfig";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUserJSONData from "@ext/enterprise/types/EnterpriseUserJSONData";
import IPermission from "@ext/security/logic/Permission/IPermission";
import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import PermissionJSONData from "@ext/security/logic/Permission/model/PermissionJSONData";
import PermissionType from "@ext/security/logic/Permission/model/PermissionType";
import Permission from "@ext/security/logic/Permission/Permission";
import IPermissionMap, { PermissionMapType } from "@ext/security/logic/PermissionMap/IPermissionMap";
import parsePermissionMapFromJSON from "@ext/security/logic/PermissionMap/parsePermissionMapFromJSON";
import User, { UserType } from "@ext/security/logic/User/User";
import UserInfo from "@ext/security/logic/User/UserInfo";

export interface EnterpriseInfo {
	workspacePermission: IPermissionMap;
	catalogPermission: IPermissionMap;
	updateDate: Date;
	catalogsProps: { [catalogName: string]: { branches?: string[]; mainBranch: string } };
}

class EnterpriseUser extends User {
	private _updateInterval = 1000 * 60 * 10; // 10 minutes
	private _enterpriseInfo: EnterpriseInfo;

	constructor(
		isLogged = false,
		info?: UserInfo,
		globalPermission?: IPermission,
		workspacePermission?: IPermissionMap,
		catalogPermission?: IPermissionMap,
		private _enterpriseConfig?: EnterpriseConfig,
		private _token?: string,
	) {
		super(isLogged, info, globalPermission, workspacePermission, catalogPermission);
		this._enterpriseInfo = {
			workspacePermission: this._workspacePermission,
			catalogPermission: this._catalogPermission,
			updateDate: new Date(0),
			catalogsProps: {},
		};
	}

	get type(): UserType {
		return "enterprise";
	}

	get token(): string {
		return this._token;
	}

	setEnterpriseInfo(info: EnterpriseInfo): void {
		if (!info) return;
		this._enterpriseInfo = info;
		this._catalogPermission = info.catalogPermission;
		this._workspacePermission = info.workspacePermission;
	}

	getEnterpriseInfo(): EnterpriseInfo {
		return this._enterpriseInfo;
	}

	async updatePermissions(checkSsoToken: true, force?: boolean): Promise<EnterpriseUser | User>;
	async updatePermissions(checkSsoToken: false, force?: boolean): Promise<EnterpriseUser>;
	async updatePermissions(checkSsoToken: boolean = false, force = false): Promise<EnterpriseUser | User> {
		// if (!this._token) return; -- not needed because we get user data from null token (anonymous user)
		if (!this._enterpriseConfig?.gesUrl) return;

		const timeDiff = new Date().getTime() - this._enterpriseInfo.updateDate.getTime();
		const interval = this._enterpriseConfig?.refreshInterval ?? this._updateInterval;
		if (this._enterpriseInfo && timeDiff < interval && !force) {
			return;
		}

		try {
			const data = await new EnterpriseApi(this._enterpriseConfig?.gesUrl).getUser(this._token, checkSsoToken);
			if (!data) {
				if (checkSsoToken) return new EnterpriseUser();
				console.log(`User data not found. ${this._enterpriseConfig?.gesUrl}`);
				return null;
			}

			const catalogsPermissions: { [catalogName: string]: PermissionJSONData } = {};
			for (const catalogName in data.catalogsPermissions) {
				catalogsPermissions[catalogName] = new Permission(data.catalogsPermissions[catalogName]).toJSON();
			}

			this._info = data.info;
			this._workspacePermission.updateAllPermissions(new Permission(data.workspacePermissions));

			this._enterpriseInfo = {
				workspacePermission: this._workspacePermission,
				catalogPermission: parsePermissionMapFromJSON({
					type: this._catalogPermission.type,
					permissions: catalogsPermissions,
				}),
				catalogsProps: data.catalogsProps,
				updateDate: new Date(),
			};
			this._catalogPermission = this._enterpriseInfo.catalogPermission;

			return this;
		} catch (error) {
			console.warn("Failed to update enterprise permissions, using cached", error);
			return this;
		}
	}

	getToken(): string {
		return this._token;
	}

	override toJSON(): EnterpriseUserJSONData {
		return {
			info: this._info,
			type: this.type,
			isLogged: this.isLogged,
			globalPermission: this._globalPermission?.toJSON?.(),
			catalogPermissionType: this._catalogPermission.type,
			workspacePermissionType: this._workspacePermission.type,
			workspacePermissionKeys: this._workspacePermission.keys,
			token: this._token ?? "",
		};
	}

	static override initInJSON(json: EnterpriseUserJSONData, enterpriseConfig?: EnterpriseConfig): EnterpriseUser {
		const permissions = {};
		for (const key of json.workspacePermissionKeys ?? []) {
			permissions[key] = { permissions: [], type: PermissionType.plain };
		}

		const user = new EnterpriseUser(
			json.isLogged,
			json.info,
			parsePermissionFromJSON(json.globalPermission),
			parsePermissionMapFromJSON({
				type: json.workspacePermissionType ?? PermissionMapType.strict,
				permissions,
			}),
			parsePermissionMapFromJSON({
				type: json.catalogPermissionType ?? PermissionMapType.strict,
				permissions: {},
			}),
			enterpriseConfig,
			json.token,
		);
		return user;
	}
}

export default EnterpriseUser;
