import IPermission from "@ext/security/logic/Permission/IPermission";
import PermissionType from "@ext/security/logic/Permission/model/PermissionType";
import AllPermission from "../AllPermission";
import Permission from "../Permission";
import PermissionJSONData from "../model/PermissionJSONData";

const parsePermissionFromJSON = (json: PermissionJSONData): IPermission => {
	if (!json) return null;
	if (json.type === PermissionType.all) return new AllPermission();
	return new Permission(typeof json === "string" ? json : json.permissions ?? "");
};

export default parsePermissionFromJSON;
