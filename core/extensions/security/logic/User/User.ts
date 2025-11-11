import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import Permission from "@ext/security/logic/Permission/Permission";
import IPermissionMap from "@ext/security/logic/PermissionMap/IPermissionMap";
import parsePermissionMapFromJSON from "@ext/security/logic/PermissionMap/parsePermissionMapFromJSON";
import StrictPermissionMap from "@ext/security/logic/PermissionMap/StrictPermissionMap";
import IPermission from "../Permission/IPermission";
import UserInfo from "./UserInfo";
import UserJSONData from "./UserJSONData";

export type UserType = "base" | "enterprise" | "ticket";

export default class User {
	constructor(
		private _isLogged = false,
		protected _info?: UserInfo,
		protected _globalPermission?: IPermission,
		protected _workspacePermission?: IPermissionMap,
		protected _catalogPermission?: IPermissionMap,
	) {
		if (!this._globalPermission) this._globalPermission = new Permission([]);
		if (!this._workspacePermission) this._workspacePermission = new StrictPermissionMap({});
		if (!this._catalogPermission) this._catalogPermission = new StrictPermissionMap({});
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

	get catalogPermission(): IPermissionMap {
		return this._catalogPermission;
	}

	get workspacePermission(): IPermissionMap {
		return this._workspacePermission;
	}

	get globalPermission(): IPermission {
		return this._globalPermission;
	}

	addCatalogPermission(catalogName: string, permission: IPermission) {
		this._catalogPermission.addPermission(catalogName, permission);
	}

	toJSON(): UserJSONData {
		return {
			info: this._info,
			type: this.type,
			isLogged: this._isLogged,
			globalPermission: this._globalPermission?.toJSON?.(),
			workspacePermission: this._workspacePermission?.toJSON?.(),
			catalogPermission: this._catalogPermission?.toJSON?.(),
		};
	}

	static initInJSON(json: UserJSONData): User {
		return new User(
			json.isLogged,
			json.info,
			parsePermissionFromJSON(json.globalPermission),
			parsePermissionMapFromJSON(json.workspacePermission),
			parsePermissionMapFromJSON(json.catalogPermission),
		);
	}
}
