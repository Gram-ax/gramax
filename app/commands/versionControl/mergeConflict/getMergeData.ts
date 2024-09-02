import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import { RepMergeConflictState, RepStashConflictState } from "@ext/git/core/Repository/model/RepostoryState";
import { Command } from "../../../types/Command";

const getMergeData: Command<{ catalogName: string }, MergeData> = Command.create({
	path: "versionControl/mergeConflict/getMergeData",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		const storage = catalog?.repo.storage;
		if (!storage) return;
		const fs = workspace.getFileStructure();
		const state = await catalog.repo.getState();
		const isTauri = getExecutingEnvironment() === "tauri";

		if (state.value === "mergeConflict" || state.value === "stashConflict") {
			const mergeState = state as RepMergeConflictState | RepStashConflictState;
			const isValid = isTauri ? await catalog.repo.isMergeStateValid() : true;
			if (!isValid) return { ok: true };
			return {
				ok: false,
				caller: mergeState.value === "mergeConflict" ? MergeConflictCaller.Branch : MergeConflictCaller.Sync,
				mergeFiles: await catalog.repo.convertToMergeResultContent(mergeState.data.conflictFiles, fs),
				reverseMerge: mergeState.data.reverseMerge,
			};
		}
		return { ok: true };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getMergeData;
