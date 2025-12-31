import IPermission from "@ext/security/logic/Permission/IPermission";
import PermissionJSONData from "@ext/security/logic/Permission/model/PermissionJSONData";

interface IPermissionMap {
	keys: string[];
	type: PermissionMapType;
	enough(key: string, permission: IPermission): boolean;
	someEnough(permission: IPermission): boolean;
	addPermission(key: string, permission: IPermission): void;
	updateAllPermissions(permission: IPermission): void;
	toJSON(): PermissionMapJSONData;
}

export enum PermissionMapType {
	strict = "strict",
	all = "all",
	/** @deprecated use strict instead */
	relax = "relax",
}

export type PermissionMapJSONData = {
	type: PermissionMapType;
	permissions: Record<string, PermissionJSONData>;
};

export default IPermissionMap;
