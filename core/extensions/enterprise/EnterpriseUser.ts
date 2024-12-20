import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUserJSONData from "@ext/enterprise/types/EnterpriseUserJSONData";
import IPermission from "@ext/security/logic/Permission/IPermission";
import Permission from "@ext/security/logic/Permission/Permission";
import User, { CatalogsPermission, UserType } from "@ext/security/logic/User/User";
import UserInfo from "@ext/security/logic/User/UserInfo";

export type EnterprisePermissionInfo = {
	permissions: CatalogsPermission;
	updateDate: Date;
};

class EnterpriseUser extends User {
	private _updateInterval = 1000 * 60 * 60 * 4; // 4 hours
	private _enterprisePermissionInfo: EnterprisePermissionInfo;

	constructor(
		isLogged = false,
		info?: UserInfo,
		globalPermission?: IPermission,
		catalogPermissions?: CatalogsPermission,
		private _gesUrl?: string,
		private _token?: string,
	) {
		super(isLogged, info, globalPermission, catalogPermissions);
		this._enterprisePermissionInfo = {
			permissions: {},
			updateDate: new Date(0),
		};
	}

	get type(): UserType {
		return "enterprise";
	}

	get gesUrl(): string {
		return this._gesUrl;
	}

	get token(): string {
		return this._token;
	}

	setPermissionInfo(enterprisePermissionInfo: EnterprisePermissionInfo): void {
		if (!enterprisePermissionInfo) return;
		this._enterprisePermissionInfo = enterprisePermissionInfo;
	}

	async updatePermissions(onUpdate: (user: EnterpriseUser) => void): Promise<void> {
		if (!this._gesUrl || !this._enterprisePermissionInfo?.updateDate) return;
		if (new Date().getTime() - this._enterprisePermissionInfo.updateDate.getTime() < this._updateInterval) return;

		const userData = await new EnterpriseApi(this._gesUrl).getUser(this._token);
		if (!userData) return;

		const enterprisePermissions: CatalogsPermission = {};
		for (const catalogName in userData.enterprisePermissions) {
			enterprisePermissions[catalogName] = new Permission(userData.enterprisePermissions[catalogName]);
		}
		this._enterprisePermissionInfo = {
			permissions: enterprisePermissions,
			updateDate: new Date(),
		};
		this._globalPermission = new Permission(userData.globalPermission);
		onUpdate(this);
	}

	getEnterprisePermission(catalogName: string): IPermission {
		return this._enterprisePermissionInfo.permissions?.[catalogName] ?? null;
	}

	getEnterprisePermissions(): CatalogsPermission {
		return this._enterprisePermissionInfo.permissions;
	}

	getEnterprisePermissionsInfo(): EnterprisePermissionInfo {
		return this._enterprisePermissionInfo;
	}

	getToken(): string {
		return this._token;
	}

	override toJSON(): EnterpriseUserJSONData {
		const json = new User(this._isLogged, this._info, this._globalPermission, this._catalogPermissions).toJSON();
		return {
			...json,
			type: this.type,
			token: this._token ?? "",
			gesUrl: this._gesUrl ?? "",
		};
	}

	static override initInJSON(json: EnterpriseUserJSONData): EnterpriseUser {
		const user = User.initInJSON(json);
		return new EnterpriseUser(
			user.isLogged,
			user.info,
			user.getGlobalPermission(),
			user.getCatalogPermissions(),
			json.gesUrl,
			json.token,
		);
	}
}

export default EnterpriseUser;
