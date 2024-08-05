import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import haveInternetAccess from "@core/utils/haveInternetAccess";
import ClientGitBranchData from "@ext/git/actions/Branch/model/ClientGitBranchData";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { Command } from "../../../types/Command";

const reset: Command<{ ctx: Context; catalogName: string }, ClientGitBranchData[]> = Command.create({
	path: "versionControl/branch/reset",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.repo.storage;
		const data = rp.getSourceData(ctx.cookie, await storage.getSourceName()) as GitSourceData;
		if (haveInternetAccess() && storage) await storage.fetch(data);
		const gvc = catalog.repo.gvc;
		const headCommitHash = await gvc.getHeadCommit();

		return (await gvc.resetBranches()).map(
			(b): ClientGitBranchData => ({
				...b.getData(),
				branchHashSameAsHead: b.getData().lastCommitOid === headCommitHash.toString(),
			}),
		);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default reset;
