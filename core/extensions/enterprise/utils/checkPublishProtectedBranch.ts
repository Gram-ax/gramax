import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { isCurrentBranchMain } from "@ext/enterprise/utils/mainBranch";
import { PublishHealthcheckCode, type PublishHealthcheckResult } from "@ext/git/core/GitPublish/PublishHealthcheck";
import ClientAuthManager from "@ext/security/logic/ClientAuthManager";

const checkPublishProtectedBranch = async (
	app: Application,
	ctx: Context,
	catalog: ReadonlyCatalog,
	gesUrl?: string,
): Promise<PublishHealthcheckResult> => {
	const isEnterprise = gesUrl && app.am instanceof ClientAuthManager && ctx.user instanceof EnterpriseUser;
	if (!isEnterprise) return;

	const am = app.am as ClientAuthManager;
	const permissionUpdateDate = (ctx.user as EnterpriseUser).getEnterpriseInfo()?.updateDate?.getTime();
	await am.forceUpdateEnterpriseUser(ctx.cookie, ctx.user as EnterpriseUser);

	if (permissionUpdateDate === (ctx.user as EnterpriseUser).getEnterpriseInfo()?.updateDate?.getTime()) {
		return { code: PublishHealthcheckCode.PermissionsUnavailable };
	}
	if (await isCurrentBranchMain(ctx.user, catalog)) {
		return { code: PublishHealthcheckCode.ProtectedBranch };
	}
};

export default checkPublishProtectedBranch;
