import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import { Command } from "../../../types/Command";

const getFiles: Command<{ catalogName: string }, GitMergeResultContent[]> = Command.create({
	path: "versionControl/mergeConflict/getFiles",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		const storage = catalog?.repo.storage;
		if (!storage) return;
		const fs = workspace.getFileStructure();
		const state = catalog.repo.state;
		const conflictFiles =
			state.value === "mergeConflict" || state.value === "stashConflict"
				? await catalog.repo.convertToMergeResultContent(state.data.conflictFiles, fs)
				: [];

		return conflictFiles;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getFiles;
