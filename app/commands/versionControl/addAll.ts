import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import { Command } from "../../types/Command";

const addAll: Command<{ catalogName: string }, void> = Command.create({
	path: "versionControl/addAll",

	kind: ResponseKind.none,

	middlewares: [new ReloadConfirmMiddleware()],

	async do({ catalogName }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog?.repo?.gvc) return;

		await catalog.repo.gvc.add();
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default addAll;
