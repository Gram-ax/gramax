import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";

const merge: Command<
	{
		catalogName: string;
		ctx: Context;
		validateMerge?: boolean;
	},
	void
> = Command.create({
	path: "mergeRequests/merge",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware()],

	async do({ catalogName, ctx, validateMerge }) {
		const workspace = this._app.wm.current();
		const rp = this._app.rp;
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const gvc = catalog?.repo?.gvc;
		if (!gvc) return;

		try {
			await catalog.repo.mergeRequests.merge(
				rp.getSourceData(ctx, await catalog.repo.storage.getSourceName()) as GitSourceData,
				validateMerge,
			);
		} finally {
			await catalog.update();
		}
	},

	params(ctx, q) {
		return {
			catalogName: q.catalogName,
			validateMerge: typeof q.validateMerge === "string" ? q.validateMerge === "true" : q.validateMerge,
			ctx,
		};
	},
});

export default merge;
