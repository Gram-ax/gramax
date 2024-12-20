import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import haveInternetAccess from "@core/utils/haveInternetAccess";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ClientGitBranchData from "@ext/git/actions/Branch/model/ClientGitBranchData";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import { Command } from "../../../types/Command";

const reset: Command<{ ctx: Context; catalogName: string }, ClientGitBranchData[]> = Command.create({
	path: "versionControl/branch/reset",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.repo.storage;
		const data = rp.getSourceData(ctx.cookie, await storage.getSourceName()) as GitSourceData;
		const isBare = catalog.repo.isBare;
		let hasCheckout = false;
		if (isBare) {
			if (haveInternetAccess() && storage) await storage.fetch(data);
			hasCheckout = (await catalog.repo.checkoutIfCurrentBranchNotExist(data)).hasCheckout;
		}
		if (haveInternetAccess() && storage) await storage.fetch(data, isBare);
		if (hasCheckout) {
			throw new DefaultError(t("git.branch.error.not-found-reload"));
		}

		const gvc = catalog.repo.gvc;
		const headCommitHash = await gvc.getHeadCommit();

		const mrs = (await catalog.repo.mergeRequests.list()).reduce((acc, mr) => {
			acc[mr.sourceBranchRef] = mr;
			return acc;
		}, {} as Record<string, MergeRequest>);

		return (await gvc.resetBranches()).map(
			(b): ClientGitBranchData => ({
				...b.getData(),
				mergeRequest: mrs[b.toString()],
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
