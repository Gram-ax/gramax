import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import checkPublishProtectedBranch from "@ext/enterprise/utils/checkPublishProtectedBranch";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import { PublishHealthcheckCode, type PublishHealthcheckResult } from "@ext/git/core/GitPublish/PublishHealthcheck";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";

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

	try {
		const shouldSync = await catalog.repo.isShouldSync({
			data: sourceData,
			shouldFetch: true,
		});

		const currentBranch = await catalog.repo.gvc.getCurrentBranch();
		const remoteBranch = currentBranch.getData().remoteName;
		if (shouldSync && remoteBranch) {
			const conflicts = await catalog.repo.gvc.hasMergeConflictsWithRemoteBranch(
				remoteBranch,
				sourceData.raw as GitSourceData,
			);
			if (conflicts.length > 0) return { code: PublishHealthcheckCode.HasGitConflicts };
		}
	} catch (e) {
		if (e instanceof GitError) return { code: PublishHealthcheckCode.Ok };
		throw e;
	}

	return { code: PublishHealthcheckCode.Ok };
};

export default checkPublishHealth;
