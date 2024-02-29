import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import SyncGitMergeConflictResolver from "../../../../../core/extensions/git/core/GitMergeConflictResolver/Sync/SyncGitMergeConflictResolver";
import GitStash from "../../../../../core/extensions/git/core/model/GitStash";
import { AuthorizeMiddleware } from "../../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../../core/logic/Context/Context";
import { Command, ResponseKind } from "../../../../types/Command";

const abort: Command<{ ctx: Context; catalogName: string; stashHash: string }, void> = Command.create({
	path: "storage/sync/mergeConflict/abort",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, stashHash }) {
		const { lib, rp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.repo.storage;
		if (!storage) return;
		const fp = lib.getFileProviderByCatalog(catalog);
		const gvc = catalog.repo.gvc;
		const syncGitMergeConflictResolver = new SyncGitMergeConflictResolver(gvc, fp, gvc.getPath());
		await syncGitMergeConflictResolver.abortMerge(
			rp.getSourceData(ctx.cookie, await storage.getSourceName()),
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
