import PermissionJSONData from "../Permission/model/PermissionJSONData";
import UserInfo from "./UserInfo2";

interface UserJSONData {
	info?: UserInfo;
	isLogged: boolean;
	globalPermission?: PermissionJSONData;
	catalogPermissions?: Record<string, PermissionJSONData>;
}

export default UserJSONData;
