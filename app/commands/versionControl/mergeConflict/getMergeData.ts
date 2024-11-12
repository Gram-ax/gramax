import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
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

		if (state.inner.value === "mergeConflict" || state.inner.value === "stashConflict") {
			const isValid = isTauri ? await state.isMergeStateValid() : true;
			if (!isValid) return { ok: true };
			return {
				ok: false,
				caller: state.inner.value === "mergeConflict" ? MergeConflictCaller.Branch : MergeConflictCaller.Sync,
				mergeFiles: await state.mergeConflictResolver.convertToMergeResultContent(
					state.inner.data.conflictFiles,
					fs,
				),
				reverseMerge: state.inner.data.reverseMerge,
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
