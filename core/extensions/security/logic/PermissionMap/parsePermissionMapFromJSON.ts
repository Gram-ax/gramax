import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import AllPermissionMap from "@ext/security/logic/PermissionMap/AllPermissionMap";
import IPermissionMap, {
	PermissionMapJSONData,
	PermissionMapType,
} from "@ext/security/logic/PermissionMap/IPermissionMap";
import StrictPermissionMap from "@ext/security/logic/PermissionMap/StrictPermissionMap";

const parsePermissionMapFromJSON = (data: PermissionMapJSONData): IPermissionMap => {
	if (!data) return new StrictPermissionMap({});
	if (data.type === PermissionMapType.all) return new AllPermissionMap();

	const permissions = Object.fromEntries(
		Object.entries(data.permissions).map(([catalogName, permissionData]) => {
			return [catalogName, parsePermissionFromJSON(permissionData)];
		}),
	);

	if (data.type === PermissionMapType.relax) return new StrictPermissionMap(permissions);
	if (data.type === PermissionMapType.strict) return new StrictPermissionMap(permissions);
	throw new DefaultError("Invalid permission map type");
};

export default parsePermissionMapFromJSON;
