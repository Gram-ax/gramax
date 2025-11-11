import AllPermissionMap from "@ext/security/logic/PermissionMap/AllPermissionMap";
import localUserInfo from "@ext/security/logic/User/localUserInfo";
import AllPermission from "../Permission/AllPermission";
import User from "./User";

const localUser = new User(true, localUserInfo, new AllPermission(), new AllPermissionMap(), new AllPermissionMap());

export default localUser;
