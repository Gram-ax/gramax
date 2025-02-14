import { PermissionMapType } from "@ext/security/logic/PermissionMap/IPermissionMap";
import { BaseUserJSONData } from "@ext/security/logic/User/UserJSONData";

interface EnterpriseUserJSONData extends BaseUserJSONData {
	token: string;
	gesUrl: string;
	catalogPermissionType: PermissionMapType;
	workspacePermissionType: PermissionMapType;
	workspacePermissionKeys: string[];
}

export default EnterpriseUserJSONData;
