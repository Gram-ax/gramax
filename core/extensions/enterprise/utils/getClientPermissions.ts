import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import ClientPermissions from "@ext/security/logic/Permission/model/ClientPermissions";
import User from "@ext/security/logic/User/User";

const getClientPermissions = (user: User): string => {
	let enterprisePermissions = {};
	if (user.type === "enterprise") {
		const permissions = (user as EnterpriseUser).getEnterprisePermissions();
		if (permissions) {
			enterprisePermissions = Object.fromEntries(Object.entries(permissions).map(([key, value]) => [key, value]));
		}
	}

	return JSON.stringify({
		global: user.getGlobalPermission()?.toJSON?.() ?? null,
		enterprise: enterprisePermissions,
	} as ClientPermissions);
};

export default getClientPermissions;
