import ClientPermissions from "@ext/security/logic/Permission/model/ClientPermissions";
import User from "@ext/security/logic/User/User";

const getClientPermissions = (user: User): string => {
	const clientPermissions: ClientPermissions = {
		global: user.globalPermission?.toJSON?.() ?? null,
		workspace: user.workspacePermission?.toJSON?.() ?? null,
		catalog: user.catalogPermission?.toJSON?.() ?? null,
	};
	return JSON.stringify(clientPermissions);
};

export default getClientPermissions;
