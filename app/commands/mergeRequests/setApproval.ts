import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import assert from "assert";
import type { Context } from "vm";
import { Command } from "../../types/Command";

const setApproval: Command<{ ctx: Context; catalogName: string; approve: boolean }, void> = Command.create({
	path: "mergeRequests/setApproval",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ ctx, catalogName, approve }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const vc = catalog?.repo?.gvc;
		if (!vc) return;

		const data = this._app.rp.getSourceData(ctx.cookie, await catalog.repo.storage?.getSourceName());
		assert(data, "source data is required to set approval");
		await catalog.repo.mergeRequests.setApproval(data, approve);
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, approve: q.approve === "true" };
	},
});

export default setApproval;
