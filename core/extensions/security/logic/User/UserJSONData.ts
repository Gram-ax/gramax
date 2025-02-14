import { PermissionMapJSONData } from "@ext/security/logic/PermissionMap/IPermissionMap";
import { UserType } from "@ext/security/logic/User/User";
import PermissionJSONData from "../Permission/model/PermissionJSONData";
import UserInfo from "./UserInfo";

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
