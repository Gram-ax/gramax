import IPermission from "@ext/security/logic/Permission/IPermission";
import AllPermission from "../AllPermission";
import Permission from "../Permission";
import PermissionJSONData from "../model/PermissionJSONData";

const parsePermissionFromJSON = (json: PermissionJSONData): IPermission => {
	if (json.type === "all") return new AllPermission();
	return new Permission(json.permissions ?? "");
};

export default parsePermissionFromJSON;
