import PermissionJSONData from "@ext/security/logic/Permission/model/PermissionJSONData";
import UserJSONData from "@ext/security/logic/User/UserJSONData";

interface EnterpriseUserJSONData extends UserJSONData {
	token: string;
	gesUrl: string;
	updateDate: number;
	enterprisePermissions?: Record<string, PermissionJSONData>;
}

export default EnterpriseUserJSONData;
