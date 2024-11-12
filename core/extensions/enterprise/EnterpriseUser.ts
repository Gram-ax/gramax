import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUserJSONData from "@ext/enterprise/EnterpriseUserJSONData";
import IPermission from "@ext/security/logic/Permission/IPermission";
import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import PermissionJSONData from "@ext/security/logic/Permission/model/PermissionJSONData";
import Permission from "@ext/security/logic/Permission/Permission";
import User, { CatalogsPermission, UserType } from "@ext/security/logic/User/User";
import UserInfo from "@ext/security/logic/User/UserInfo";

class EnterpriseUser extends User {
	private _updateInterval = 1000 * 60 * 60 * 4; // 4 hours

	constructor(
		isLogged = false,
		info?: UserInfo,
		globalPermission?: IPermission,
		catalogPermissions?: CatalogsPermission,
		private _gesUrl?: string,
		private _token?: string,
		private _updateDate?: Date,
		private _enterprisePermissions?: CatalogsPermission,
	) {
		super(isLogged, info, globalPermission, catalogPermissions);
		if (!this._updateDate) this._updateDate = new Date(0);
	}

	get type(): UserType {
		return "enterprise";
	}

	async updatePermissions(): Promise<void> {
		if (!this._gesUrl || !this._updateDate) return;
		if (new Date().getTime() - this._updateDate.getTime() < this._updateInterval) return;

		const userData = await new EnterpriseApi(this._gesUrl).getUser(this._token);
		if (!userData) return;

		const enterprisePermissions: CatalogsPermission = {};
		for (const catalogName in userData.enterprisePermissions) {
			enterprisePermissions[catalogName] = new Permission(userData.enterprisePermissions[catalogName]);
		}
		this._enterprisePermissions = enterprisePermissions;
		this._globalPermission = new Permission(userData.globalPermission);
		this._updateDate = new Date();
	}

	getEnterprisePermission(catalogName: string): IPermission {
		return this._enterprisePermissions?.[catalogName] ?? null;
	}

	getEnterprisePermissions(): CatalogsPermission {
		return this._enterprisePermissions;
	}

	getToken(): string {
		return this._token;
	}

	override toJSON(): EnterpriseUserJSONData {
		const json = new User(this._isLogged, this._info, this._globalPermission, this._catalogPermissions).toJSON();
		const ep: Record<string, PermissionJSONData> = {};
		Object.keys(this._enterprisePermissions ?? {}).forEach((catalogName) => {
			ep[catalogName] = this._enterprisePermissions[catalogName]?.toJSON?.();
		});
		return {
			...json,
			type: this.type,
			token: this._token ?? "",
			gesUrl: this._gesUrl ?? "",
			updateDate: this._updateDate.getTime(),
			enterprisePermissions: ep,
		};
	}

	static override initInJSON(json: EnterpriseUserJSONData): EnterpriseUser {
		const user = User.initInJSON(json);
		const enterprisePermissions: CatalogsPermission = {};
		Object.keys(json.enterprisePermissions ?? {}).forEach((catalogName) => {
			enterprisePermissions[catalogName] = parsePermissionFromJSON(json.enterprisePermissions[catalogName]);
		});
		return new EnterpriseUser(
			user.isLogged,
			user.info,
			user.getGlobalPermission(),
			user.getCatalogPermissions(),
			json.token,
			json.gesUrl,
			new Date(json.updateDate),
			enterprisePermissions,
		);
	}
}

export default EnterpriseUser;
