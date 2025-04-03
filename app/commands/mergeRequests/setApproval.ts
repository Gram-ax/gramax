import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import assert from "assert";
import { Command } from "../../types/Command";
import type Context from "@core/Context/Context";

const setApproval: Command<{ ctx: Context; catalogName: string; approve: boolean }, void> = Command.create({
	path: "mergeRequests/setApproval",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ ctx, catalogName, approve }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const vc = catalog?.repo?.gvc;
		if (!vc) return;

		const data = this._app.rp.getSourceData(ctx, await catalog.repo.storage?.getSourceName()) as GitSourceData;
		assert(data, "source data is required to set approval");
		await catalog.repo.mergeRequests.setApproval(data, approve);
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, approve: q.approve === "true" };
	},
});

export default setApproval;
