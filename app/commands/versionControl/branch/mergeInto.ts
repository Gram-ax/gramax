import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import type { RepositoryMergeConflictState } from "@ext/git/core/Repository/state/RepositoryState";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../core/logic/Context/Context";
import { Command } from "../../../types/Command";

export type MergeIntoParams = {
	ctx: Context;
	catalogName: string;
	branchName: string;
	deleteAfterMerge: boolean;
	validateMerge?: boolean;
	squash?: boolean;
	isMergeRequest?: boolean;
};

const mergeInto: Command<MergeIntoParams, MergeData> = Command.create({
	path: "versionControl/branch/mergeInto",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, branchName, deleteAfterMerge, validateMerge, squash, isMergeRequest }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const storage = catalog?.repo.storage;
		if (!storage) return;

		const sourceData = rp.getSourceData(ctx, await storage.getSourceName());
		const mergeResult = await catalog.repo.merge({
			data: sourceData,
			targetBranch: branchName,
			deleteAfterMerge,
			validateMerge,
			squash,
			isMergeRequest,
		});
		const state = await catalog.repo.getState();
		if (!mergeResult.length) await catalog.update();

		const isOk = !mergeResult.length;
		return isOk
			? { ok: true }
			: {
					ok: false,
					mergeFiles: mergeResult,
					reverseMerge: (state.inner as RepositoryMergeConflictState).data.reverseMerge,
					caller: MergeConflictCaller.Branch,
			  };
	},

	params(ctx, q) {
		return {
			ctx,
			deleteAfterMerge: q.deleteAfterMerge === "true",
			catalogName: q.catalogName,
			branchName: q.branchName,
			squash: q.squash === "true",
		};
	},
});

export default mergeInto;
