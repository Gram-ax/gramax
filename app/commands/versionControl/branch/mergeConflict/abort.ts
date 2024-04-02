import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import BranchGitMergeConflictResolver from "../../../../../core/extensions/git/core/GitMergeConflictResolver/Branch/BranchGitMergeConflictResolver";
import { AuthorizeMiddleware } from "../../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { Command } from "../../../../types/Command";

const abort: Command<{ theirsBranch: string; catalogName: string; headBeforeMerge?: string }, void> = Command.create({
	path: "versionControl/branch/mergeConflict/abort",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ theirsBranch, catalogName, headBeforeMerge }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.repo.storage;
		if (!storage) return;

		const fp = lib.getFileProviderByCatalog(catalog);

		const gvc = catalog.repo.gvc;
		const branchGitMergeConflictResolver = new BranchGitMergeConflictResolver(gvc, fp, gvc.getPath());
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
