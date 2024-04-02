import deleteBranchAfterMerge from "@app/commands/versionControl/branch/mergeConflict/utils/deleteBranchAfterMerge";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { MergeFile } from "../../../../../core/extensions/git/actions/MergeConflictHandler/model/MergeFile";
import BranchGitMergeConflictResolver from "../../../../../core/extensions/git/core/GitMergeConflictResolver/Branch/BranchGitMergeConflictResolver";
import { AuthorizeMiddleware } from "../../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../../core/logic/Context/Context";
import { Command } from "../../../../types/Command";

const resolve: Command<
	{
		ctx: Context;
		catalogName: string;
		files: MergeFile[];
		theirsBranch: string;
		branchNameBefore: string;
		headBeforeMerge: string;
		deleteAfterMerge: boolean;
	},
	void
> = Command.create({
	path: "versionControl/branch/mergeConflict/resolve",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, files, theirsBranch, branchNameBefore, headBeforeMerge, deleteAfterMerge }) {
		const { lib, rp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const gvc = catalog.repo.gvc;
		const storage = catalog.repo.storage;
		const sourceData = rp.getSourceData(ctx.cookie, await storage.getSourceName()) as GitSourceData;

		const fp = lib.getFileProviderByCatalog(catalog);

		const branchGitMergeConflictResolver = new BranchGitMergeConflictResolver(gvc, fp, gvc.getPath());
		await branchGitMergeConflictResolver.resolveConflictedFiles(theirsBranch, files, sourceData);

		if ((await storage.getType()) !== SourceType.gitHub && (await storage.getType()) !== SourceType.gitLab) return;

		if (deleteAfterMerge) {
			await deleteBranchAfterMerge({
				commands: this._commands,
				branchNameBefore,
				catalogName,
				gvc,
				headBeforeMerge,
				sourceData,
				storage: storage as GitStorage,
			});
		}

		await storage.push(sourceData);
	},

	params(ctx, q, body) {
		return {
			ctx,
			catalogName: q.catalogName,
			files: body as MergeFile[],
			theirsBranch: q.theirsBranch,
			branchNameBefore: q.branchNameBefore,
			headBeforeMerge: q.headBeforeMerge,
			deleteAfterMerge: q.deleteAfterMerge === "true",
		};
	},
});

export default resolve;
