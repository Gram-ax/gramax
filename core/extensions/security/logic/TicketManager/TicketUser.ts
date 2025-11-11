import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import parsePermissionMapFromJSON from "@ext/security/logic/PermissionMap/parsePermissionMapFromJSON";
import User, { UserType } from "@ext/security/logic/User/User";
import UserJSONData from "@ext/security/logic/User/UserJSONData";

class TicketUser extends User {
	get type(): UserType {
		return "ticket";
	}

	static initInJSON(json: UserJSONData): User {
		return new TicketUser(
			json.isLogged,
			json.info,
			parsePermissionFromJSON(json.globalPermission),
			parsePermissionMapFromJSON(json.workspacePermission),
			parsePermissionMapFromJSON(json.catalogPermission),
		);
	}
}

export default TicketUser;
