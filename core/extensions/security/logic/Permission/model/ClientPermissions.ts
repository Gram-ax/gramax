import PermissionJSONData from "@ext/security/logic/Permission/model/PermissionJSONData";
import { PermissionMapJSONData } from "@ext/security/logic/PermissionMap/IPermissionMap";

interface ClientPermissions {
	global: PermissionJSONData;
	workspace: PermissionMapJSONData;
	catalog: PermissionMapJSONData;
}

export default ClientPermissions;
