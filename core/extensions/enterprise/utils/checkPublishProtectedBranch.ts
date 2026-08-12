import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { isCurrentBranchProtected } from "@ext/enterprise/utils/mainBranch";
import refreshEnterprisePermissions from "@ext/enterprise/utils/refreshEnterprisePermissions";
import { PublishHealthcheckCode, type PublishHealthcheckResult } from "@ext/git/core/GitPublish/PublishHealthcheck";

const checkPublishProtectedBranch = async (
	app: Application,
	ctx: Context,
	catalog: ReadonlyCatalog,
	gesUrl?: string,
): Promise<PublishHealthcheckResult> => {
	const permissionsUpdated = await refreshEnterprisePermissions(app, ctx, gesUrl);
	if (permissionsUpdated === undefined) return;
	if (!permissionsUpdated) return { code: PublishHealthcheckCode.PermissionsUnavailable };

	if (await isCurrentBranchProtected(ctx.user, catalog)) {
		return { code: PublishHealthcheckCode.ProtectedBranch };
	}
};

export default checkPublishProtectedBranch;
