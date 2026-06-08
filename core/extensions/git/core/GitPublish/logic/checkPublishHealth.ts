import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import checkPublishProtectedBranch from "@ext/enterprise/utils/checkPublishProtectedBranch";
import { PublishHealthcheckCode, type PublishHealthcheckResult } from "@ext/git/core/GitPublish/PublishHealthcheck";

const checkPublishHealth = async (
	app: Application,
	ctx: Context,
	catalog: ReadonlyCatalog,
	gesUrl?: string,
): Promise<PublishHealthcheckResult> => {
	const res = await checkPublishProtectedBranch(app, ctx, catalog, gesUrl);
	if (res) return res;

	const storage = catalog.repo.storage;
	if (!storage) return { code: PublishHealthcheckCode.NoStorageConnected };

	const sourceData = app.rp.getSourceData(ctx, await storage.getSourceName());
	const shouldSync = await catalog.repo.isShouldSync({
		data: sourceData,
		shouldFetch: true,
	});

	if (shouldSync && !(await catalog.repo.canSync())) {
		return { code: PublishHealthcheckCode.HasGitConflicts };
	}

	return { code: PublishHealthcheckCode.Ok };
};

export default checkPublishHealth;
