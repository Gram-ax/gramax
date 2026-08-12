import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { getWorkspaceGesUrl } from "@ext/enterprise/utils/getWorkspaceEnterpriseConfig";
import isReadOnlyEnterprise from "@ext/enterprise/utils/isReadOnlyEnterprise";
import type { Workspace } from "@ext/workspace/Workspace";

const isCatalogReadOnly = async (
	app: Application,
	workspace: Workspace,
	ctx: Context,
	catalog: ReadonlyCatalog,
): Promise<boolean> => {
	const workspaceConfig = await workspace.config();
	const workspaceGesUrl = getWorkspaceGesUrl(workspaceConfig);

	return Boolean(
		app.conf.isReadOnly ||
			!!catalog?.props?.resolvedView ||
			(catalog?.basePath && workspace.getFileProvider().at(catalog.basePath).isReadOnly) ||
			(workspaceGesUrl && (await isReadOnlyEnterprise(ctx.user, catalog))),
	);
};

export default isCatalogReadOnly;
