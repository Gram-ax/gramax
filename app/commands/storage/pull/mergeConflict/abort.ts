import VersionControlType from "../../../../../core/extensions/VersionControl/model/VersionControlType";
import SyncGitMergeConflictResolver from "../../../../../core/extensions/git/core/GitMergeConflictResolver/Sync/SyncGitMergeConflictResolver";
import GitVersionControl from "../../../../../core/extensions/git/core/GitVersionControl/GitVersionControl";
import GitStash from "../../../../../core/extensions/git/core/model/GitStash";
import { AuthorizeMiddleware } from "../../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../../core/logic/Context/Context";
import { Command, ResponseKind } from "../../../../types/Command";

const abort: Command<{ ctx: Context; catalogName: string; stashHash: string }, void> = Command.create({
	path: "storage/pull/mergeConflict/abort",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, stashHash }) {
		const { lib, sp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.getStorage();
		if (!storage) return;
		const fp = lib.getFileProviderByCatalog(catalog);
		const vc = await catalog.getVersionControl();
		if (vc.getType() !== VersionControlType.git) return;
		const syncGitMergeConflictResolver = new SyncGitMergeConflictResolver(
			vc as GitVersionControl,
			fp,
			vc.getPath(),
		);
		await syncGitMergeConflictResolver.abortMerge(
			sp.getSourceData(ctx.cookie, await storage.getSourceName()),
			new GitStash(stashHash),
		);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const stashHash = q.stashHash;
		return { ctx, catalogName, stashHash };
	},
});

export default abort;
