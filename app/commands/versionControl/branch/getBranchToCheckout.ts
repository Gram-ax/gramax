import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { RepCheckoutState } from "@ext/git/core/Repository/model/RepostoryState";
import { Command } from "../../../types/Command";

const getBranchToCheckout: Command<{ catalogName: string }, string> = Command.create({
	path: "versionControl/branch/getBranchToCheckout",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog?.repo?.gvc) return;

		const state = await catalog.repo.getState();
		if (state.value !== "checkout") return;
		return (state as RepCheckoutState).data.to;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getBranchToCheckout;
