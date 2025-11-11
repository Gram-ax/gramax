import { EnterpriseConfig } from "@app/config/AppConfig";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { configureWorkspacePermission, editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import User from "@ext/security/logic/User/User";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";

export const initEnterpriseDocportalSource = async (
	user: User,
	enterpriseConfig: EnterpriseConfig,
	setSource: (source: SourceData) => void,
) => {
	if (user.type !== "enterprise") return;
	const enterpriseUser = user as EnterpriseUser;

	const canEditCatalog = enterpriseUser.workspacePermission.someEnough(editCatalogPermission);
	const canConfigureWorkspace = enterpriseUser.workspacePermission.someEnough(configureWorkspacePermission);
	if (!canConfigureWorkspace && !canEditCatalog) return;

	const userSettings = await new EnterpriseApi(enterpriseConfig.gesUrl).getUserSettings(enterpriseUser.token);
	if (!userSettings) return;

	const source = userSettings.source;
	if (!source) return;

	setSource(source);
};
