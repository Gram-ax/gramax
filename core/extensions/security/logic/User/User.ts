import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import IPermission from "../Permission/IPermission";
import PermissionJSONData from "../Permission/model/PermissionJSONData";
import UserInfo from "./UserInfo2";
import UserJSONData from "./UserJSONData";

export default class User {
	private _info: UserInfo;
	private _isLogged: boolean;
	private _globalPermission: IPermission;
	private _catalogPermissions: { [catalogName: string]: IPermission };

	constructor(
		isLogged = false,
		info?: UserInfo,
		globalPermission?: IPermission,
		catalogPermissions?: { [catalogName: string]: IPermission },
	) {
		this._info = info;
		this._isLogged = isLogged;
		this._globalPermission = globalPermission;
		this._catalogPermissions = catalogPermissions ?? {};
	}

	get info(): UserInfo {
		return this._info;
	}

	get isLogged(): boolean {
		return this._isLogged;
	}

	getGlobalPermission(): IPermission {
		return this._globalPermission;
	}

	getCatalogPermission(catalogName: string): IPermission {
		return this._catalogPermissions?.[catalogName] ?? null;
	}

	getCatalogPermissions(): { [catalogName: string]: IPermission } {
		return this._catalogPermissions;
	}

	setGlobalPermission(permission: IPermission): void {
		this._globalPermission = permission;
	}

	setCatalogPermission(catalogName: string, permission: IPermission): void {
		this._catalogPermissions[catalogName] = permission;
	}

	setCatalogPermissions(catalogPermissions: { [catalogName: string]: IPermission }): void {
		this._catalogPermissions = catalogPermissions;
	}

	toJSON(): UserJSONData {
		const cp: Record<string, PermissionJSONData> = {};
		Object.keys(this._catalogPermissions).forEach((catalogName) => {
			cp[catalogName] = this._catalogPermissions[catalogName]?.toJSON?.();
		});
		return {
			info: this._info,
			isLogged: this._isLogged,
			globalPermission: this._globalPermission?.toJSON?.(),
			catalogPermissions: cp,
		};
	}

	static initInJSON(json: UserJSONData): User {
		if (!json?.catalogPermissions) return new User();
		const cp: { [catalogName: string]: IPermission } = {};
		Object.keys(json.catalogPermissions).forEach((catalogName) => {
			cp[catalogName] = parsePermissionFromJSON(json.catalogPermissions[catalogName]);
		});
		return new User(json.isLogged, json.info, parsePermissionFromJSON(json.globalPermission), cp);
	}
}
