import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import { RepMergeConflictState } from "@ext/git/core/Repository/model/RepostoryState";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../core/logic/Context/Context";
import { Command } from "../../../types/Command";

const mergeInto: Command<
	{ ctx: Context; catalogName: string; branchName: string; deleteAfterMerge: boolean },
	MergeData
> = Command.create({
	path: "versionControl/branch/mergeInto",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, branchName, deleteAfterMerge }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		const storage = catalog?.repo.storage;
		if (!storage) return;

		const sourceData = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		const mergeResult = await catalog.repo.mergeInto(branchName, deleteAfterMerge, sourceData);
		const state = await catalog.repo.getState();
		if (!mergeResult.length) {
			await catalog.update(rp);
		}

		const isOk = !mergeResult.length;
		return isOk
			? { ok: true }
			: {
					ok: false,
					mergeFiles: mergeResult,
					reverseMerge: (state as RepMergeConflictState).data.reverseMerge,
					caller: MergeConflictCaller.Branch,
			  };
	},

	params(ctx, q) {
		return {
			ctx,
			deleteAfterMerge: q.deleteAfterMerge === "true",
			catalogName: encodeURIComponent(q.catalogName),
			branchName: encodeURIComponent(q.branchName),
		};
	},
});

export default mergeInto;
