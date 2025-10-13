import AllPermissionMap from "@ext/security/logic/PermissionMap/AllPermissionMap";
import AllPermission from "../Permission/AllPermission";
import User from "./User";

const localUser = new User(
	true,
	{ name: "Admin", mail: "", id: "admin" },
	new AllPermission(),
	new AllPermissionMap(),
	new AllPermissionMap(),
);

export default localUser;
