import VersionControlType from "../../../../../core/extensions/VersionControl/model/VersionControlType";
import { MergeFile } from "../../../../../core/extensions/git/actions/MergeConflictHandler/model/MergeFile";
import BranchGitMergeConflictResolver from "../../../../../core/extensions/git/core/GitMergeConflictResolver/Branch/BranchGitMergeConflictResolver";
import GitVersionControl from "../../../../../core/extensions/git/core/GitVersionControl/GitVersionControl";
import { AuthorizeMiddleware } from "../../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../../core/logic/Context/Context";
import { Command, ResponseKind } from "../../../../types/Command";

const resolve: Command<{ ctx: Context; catalogName: string; files: MergeFile[]; theirsBranch: string }, void> =
	Command.create({
		path: "versionControl/branch/mergeConflict/resolve",

		kind: ResponseKind.none,

		middlewares: [new AuthorizeMiddleware()],

		async do({ ctx, catalogName, files, theirsBranch }) {
			const { lib, sp } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			if (!catalog) return;
			const vc = await catalog.getVersionControl();
			if (vc.getType() !== VersionControlType.git) return;
			const storage = catalog.getStorage();
			const sourceData = sp.getSourceData(ctx.cookie, await storage.getSourceName());

			const fp = lib.getFileProviderByCatalog(catalog);

			const branchGitMergeConflictResolver = new BranchGitMergeConflictResolver(
				vc as GitVersionControl,
				fp,
				vc.getPath(),
			);
			await branchGitMergeConflictResolver.resolveConflictedFiles(theirsBranch, files, sourceData);
			await storage.push(sourceData);
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const theirsBranch = q.theirsBranch;
			return { ctx, catalogName, files: body as MergeFile[], theirsBranch };
		},
	});

export default resolve;
