import PermissionJSONData from "@ext/security/logic/Permission/model/PermissionJSONData";

interface ClientPermissions {
	global: PermissionJSONData;
	enterprise: Record<string, PermissionJSONData>;
}

export default ClientPermissions;
