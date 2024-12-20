import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { configureWorkspacePermission } from "@ext/security/logic/Permission/Permissions";
import User from "@ext/security/logic/User/User";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";

export const initEnterpriseDocportalSource = async (
	user: User,
	setSource: (source: SourceData) => void,
) => {
	if (user.type !== "enterprise") return;
	const enterpriseUser = user as EnterpriseUser;

	const globalPermission = enterpriseUser.getGlobalPermission();
	if (!globalPermission.enough(configureWorkspacePermission)) return;

	const userSettings = await new EnterpriseApi(enterpriseUser.gesUrl).getUserSettings(enterpriseUser.token);
	if (!userSettings) return;

	const source = userSettings.source;
	if (!source) return;

	setSource(source);
};
