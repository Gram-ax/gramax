import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import { GitMergeResultContent } from "../../../../core/extensions/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../core/logic/Context/Context";
import { Command } from "../../../types/Command";

const resolve: Command<{ ctx: Context; catalogName: string; files: GitMergeResultContent[] }, void> = Command.create({
	path: "versionControl/mergeConflict/resolve",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, files }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog?.repo.storage;
		if (!storage) return;
		const sourceData = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		const state = await catalog.repo.getState();

		try {
			await state.resolveMerge(files, sourceData);
		} catch (e) {
			await state.abortMerge(sourceData);
			throw e;
		} finally {
			await catalog.update();
		}
	},

	params(ctx, q, body) {
		return { ctx, catalogName: q.catalogName, files: body as GitMergeResultContent[] };
	},
});

export default resolve;
