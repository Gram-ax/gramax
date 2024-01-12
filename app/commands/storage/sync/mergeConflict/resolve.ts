import { MergeFile } from "../../../../../core/extensions/git/actions/MergeConflictHandler/model/MergeFile";
import SyncGitMergeConflictResolver from "../../../../../core/extensions/git/core/GitMergeConflictResolver/Sync/SyncGitMergeConflictResolver";
import GitStash from "../../../../../core/extensions/git/core/model/GitStash";
import { AuthorizeMiddleware } from "../../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { Command, ResponseKind } from "../../../../types/Command";

const resolve: Command<{ catalogName: string; files: MergeFile[]; stashHash: string }, void> = Command.create({
	path: "storage/sync/mergeConflict/resolve",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, files, stashHash }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const fp = lib.getFileProviderByCatalog(catalog);
		const vc = catalog.repo.gvc;

		const syncGitMergeConflictResolver = new SyncGitMergeConflictResolver(vc, fp, vc.getPath());

		await syncGitMergeConflictResolver.resolveConflictedFiles(files, new GitStash(stashHash));
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const stashHash = q.stashHash;
		return { ctx, catalogName, files: body as MergeFile[], stashHash };
	},
});

export default resolve;
