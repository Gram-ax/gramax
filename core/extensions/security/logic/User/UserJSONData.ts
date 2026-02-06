import type { PermissionMapJSONData } from "@ext/security/logic/PermissionMap/IPermissionMap";
import type { UserType } from "@ext/security/logic/User/User";
import type PermissionJSONData from "../Permission/model/PermissionJSONData";
import type UserInfo from "./UserInfo";

export interface BaseUserJSONData {
	type: UserType;
	info?: UserInfo;
	isLogged: boolean;
	globalPermission?: PermissionJSONData;
}

interface UserJSONData extends BaseUserJSONData {
	catalogPermission?: PermissionMapJSONData;
	workspacePermission?: PermissionMapJSONData;
}

export default UserJSONData;
