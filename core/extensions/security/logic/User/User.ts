import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import IPermission from "../Permission/IPermission";
import PermissionJSONData from "../Permission/model/PermissionJSONData";
import UserInfo from "./UserInfo";
import UserJSONData from "./UserJSONData";

export type UserType = "base" | "enterprise";
export type CatalogsPermission = { [catalogName: string]: IPermission };

export default class User {
	protected _info: UserInfo;
	protected _isLogged: boolean;
	protected _globalPermission: IPermission;
	protected _catalogPermissions: CatalogsPermission;

	constructor(
		isLogged = false,
		info?: UserInfo,
		globalPermission?: IPermission,
		catalogPermissions?: CatalogsPermission,
	) {
		this._info = info;
		this._isLogged = isLogged;
		this._globalPermission = globalPermission;
		this._catalogPermissions = catalogPermissions ?? {};
	}

	get type(): UserType {
		return "base";
	}

	get info(): UserInfo {
		return this._info;
	}

	get isLogged(): boolean {
		return this._isLogged;
	}

	getCatalogPermission(catalogName: string): IPermission {
		return this._catalogPermissions?.[catalogName] ?? null;
	}

	getCatalogPermissions(): CatalogsPermission {
		return this._catalogPermissions;
	}

	setCatalogPermission(catalogName: string, permission: IPermission): void {
		this._catalogPermissions[catalogName] = permission;
	}

	getGlobalPermission(): IPermission {
		return this._globalPermission;
	}

	toJSON(): UserJSONData {
		const cp: Record<string, PermissionJSONData> = {};
		Object.keys(this._catalogPermissions ?? {}).forEach((catalogName) => {
			cp[catalogName] = this._catalogPermissions[catalogName]?.toJSON?.();
		});
		return {
			info: this._info,
			type: this.type,
			isLogged: this._isLogged,
			globalPermission: this._globalPermission?.toJSON?.(),
			catalogPermissions: cp,
		};
	}

	static initInJSON(json: UserJSONData): User {
		const cp: CatalogsPermission = {};
		Object.keys(json.catalogPermissions ?? {}).forEach((catalogName) => {
			cp[catalogName] = parsePermissionFromJSON(json.catalogPermissions[catalogName]);
		});
		return new User(json.isLogged, json.info, parsePermissionFromJSON(json.globalPermission), cp);
	}
}
