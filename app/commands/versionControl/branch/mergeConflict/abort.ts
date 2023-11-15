import { GitVersion } from "@ext/git/core/model/GitVersion";
import VersionControlType from "../../../../../core/extensions/VersionControl/model/VersionControlType";
import BranchGitMergeConflictResolver from "../../../../../core/extensions/git/core/GitMergeConflictResolver/Branch/BranchGitMergeConflictResolver";
import GitVersionControl from "../../../../../core/extensions/git/core/GitVersionControl/GitVersionControl";
import { AuthorizeMiddleware } from "../../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { Command, ResponseKind } from "../../../../types/Command";

const abort: Command<{ theirsBranch: string; catalogName: string; headBeforeMerge?: string }, void> = Command.create({
	path: "versionControl/branch/mergeConflict/abort",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ theirsBranch, catalogName, headBeforeMerge }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.getStorage();
		if (!storage) return;

		const fp = lib.getFileProviderByCatalog(catalog);

		const vc = await catalog.getVersionControl();
		if (vc.getType() !== VersionControlType.git) return;
		const branchGitMergeConflictResolver = new BranchGitMergeConflictResolver(
			vc as GitVersionControl,
			fp,
			vc.getPath(),
		);
		await branchGitMergeConflictResolver.abortMerge(
			theirsBranch,
			headBeforeMerge ? new GitVersion(headBeforeMerge) : undefined,
		);
	},

	params(_, q) {
		const theirsBranch = q.theirsBranch;
		const catalogName = q.catalogName;
		return { theirsBranch: theirsBranch, catalogName };
	},
});

export default abort;
