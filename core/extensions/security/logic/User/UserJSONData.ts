import { UserType } from "@ext/security/logic/User/User";
import PermissionJSONData from "../Permission/model/PermissionJSONData";
import UserInfo from "./UserInfo";

interface UserJSONData {
	type: UserType;
	info?: UserInfo;
	isLogged: boolean;
	globalPermission?: PermissionJSONData;
	catalogPermissions?: Record<string, PermissionJSONData>;
}

export default UserJSONData;
