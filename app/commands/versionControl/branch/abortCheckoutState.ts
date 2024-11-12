import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { Command } from "../../../types/Command";

const abortCheckoutState: Command<{ catalogName: string }, void> = Command.create({
	path: "versionControl/branch/abortCheckoutState",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog?.repo?.gvc) return;

		const state = await catalog.repo.getState();
		if (state.inner.value === "checkout") await state.abortCheckoutState();
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default abortCheckoutState;
